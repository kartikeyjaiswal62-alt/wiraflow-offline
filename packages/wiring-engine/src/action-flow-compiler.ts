/**
 * Action Flow Compiler
 *
 * For every interactive widget that triggers an action (button press, form submit,
 * file select), generates a WiringActionFlow with ordered steps.
 *
 * Pipeline: UISemanticGraph actions + BackendIntentGraph → WiringActionFlow[] + WiringFlowStep[]
 */

import type {
  UISemanticGraph,
  WidgetNode,
  BackendIntentGraph,
  SupabaseSchemaPlan,
  WiringActionFlow,
  WiringFlowStep,
  WiringMutationBinding,
  WiringUploadBinding,
  WiringNavigationBinding,
  WiringFunctionBinding,
  WiringGuard,
  WiringSourceLink,
} from "@wiraflow/contracts";

export interface ActionFlowCompilationResult {
  actionFlows: WiringActionFlow[];
  flowSteps: WiringFlowStep[];
  mutationBindings: WiringMutationBinding[];
  uploadBindings: WiringUploadBinding[];
  navigationBindings: WiringNavigationBinding[];
  functionBindings: WiringFunctionBinding[];
  guards: WiringGuard[];
}

/**
 * Compile action flows from all interactive widgets.
 */
export function compileActionFlows(
  uiGraph: UISemanticGraph,
  backendGraph: BackendIntentGraph,
  schemaPlan: SupabaseSchemaPlan,
  sourceLinks: WiringSourceLink[]
): ActionFlowCompilationResult {
  const actionFlows: WiringActionFlow[] = [];
  const flowSteps: WiringFlowStep[] = [];
  const mutationBindings: WiringMutationBinding[] = [];
  const uploadBindings: WiringUploadBinding[] = [];
  const navigationBindings: WiringNavigationBinding[] = [];
  const functionBindings: WiringFunctionBinding[] = [];
  const guards: WiringGuard[] = [];

  // Find all interactive widgets with actions
  const actionWidgets = uiGraph.widgets.filter(
    (w) => w.interactive && w.action
  );

  for (const widget of actionWidgets) {
    const action = widget.action!;
    const flowKey = `flow-${widget.key}`;
    const stepKeys: string[] = [];
    const successStateKeys: string[] = [];
    const failureStateKeys: string[] = [];

    const srcLink: WiringSourceLink = {
      key: `src-${flowKey}`,
      artifact: "UISemanticGraph",
      artifactKey: widget.key,
      reason: `Widget "${widget.label}" triggers ${action.operation}`,
    };
    sourceLinks.push(srcLink);

    // Determine the trigger type
    const trigger = inferTrigger(widget);

    // Generate guard if needed
    if (widget.permissionHint?.requiredRoles?.length || widget.permissionHint?.ownerOnly) {
      const guardKey = `guard-${widget.key}`;
      guards.push({
        key: guardKey,
        flowKey,
        guardType: widget.permissionHint.ownerOnly
          ? "ownership_required"
          : "role_required",
        enforcement: "both",
        condition: widget.permissionHint.ownerOnly
          ? "auth.uid() = record.created_by"
          : `role IN (${widget.permissionHint.requiredRoles.map((r) => `'${r}'`).join(", ")})`,
        failureAction: "show_error_toast",
        sourceLinkKeys: [srcLink.key],
      });

      const guardStepKey = `step-${widget.key}-guard`;
      flowSteps.push({
        key: guardStepKey,
        flowKey,
        stepType: "guard_check",
        executionMode: "server_enforced",
        bindingKey: guardKey,
        description: `Check permissions for ${action.operation}`,
      });
      stepKeys.push(guardStepKey);
    }

    // Generate steps based on the action operation
    switch (action.operation) {
      case "create":
      case "update":
      case "upsert":
      case "delete": {
        // Collect input step for create/update
        if (action.operation !== "delete") {
          const collectKey = `step-${widget.key}-collect`;
          flowSteps.push({
            key: collectKey,
            flowKey,
            stepType: "collect_input",
            executionMode: "client_direct",
            description: `Validate form inputs for ${action.operation}`,
          });
          stepKeys.push(collectKey);
        }

        // Mutation step
        const mutKey = `mut-${widget.key}`;
        const targetTableKey = action.targetEntityKey
          ? schemaPlan.tables.find((t) => t.key === action.targetEntityKey)?.name
          : undefined;

        mutationBindings.push({
          key: mutKey,
          actionKey: widget.key,
          mutationMode: "direct_table_write",
          targetTableKey,
          operation: action.operation as WiringMutationBinding["operation"],
          inputSources: action.operation === "delete"
            ? ["route"]
            : ["form", "session_actor"],
          transactionNeed: "single_resource",
          sourceLinkKeys: [srcLink.key],
        });

        const mutStepKey = `step-${widget.key}-mutate`;
        flowSteps.push({
          key: mutStepKey,
          flowKey,
          stepType: "mutate",
          executionMode: "client_direct",
          bindingKey: mutKey,
          description: `Execute ${action.operation} on ${action.targetEntityKey ?? "entity"}`,
          onFailure: "show_error_toast",
        });
        stepKeys.push(mutStepKey);

        // Success notification
        const successKey = `step-${widget.key}-success`;
        flowSteps.push({
          key: successKey,
          flowKey,
          stepType: "notify",
          executionMode: "client_direct",
          description: `Show success confirmation for ${action.operation}`,
        });
        stepKeys.push(successKey);
        successStateKeys.push(successKey);
        break;
      }

      case "upload": {
        // Find storage bucket
        const bucket = schemaPlan.buckets[0]; // Default to first bucket
        const uploadKey = `upload-${widget.key}`;

        uploadBindings.push({
          key: uploadKey,
          actionKey: widget.key,
          bucketKey: bucket?.name ?? "uploads",
          uploadMode: "direct_to_storage",
          pathInputs: ["owner_scope", "filename"],
          sourceLinkKeys: [srcLink.key],
        });

        const uploadStepKey = `step-${widget.key}-upload`;
        flowSteps.push({
          key: uploadStepKey,
          flowKey,
          stepType: "upload",
          executionMode: "client_direct",
          bindingKey: uploadKey,
          description: `Upload file to ${bucket?.name ?? "storage"}`,
          onFailure: "show_error_toast",
        });
        stepKeys.push(uploadStepKey);
        break;
      }

      case "navigate": {
        const navKey = `nav-${widget.key}`;
        navigationBindings.push({
          key: navKey,
          actionKey: widget.key,
          routeKey: action.targetPageKey ?? "unknown",
          paramSources: [],
          navigationMode: "immediate",
          sourceLinkKeys: [srcLink.key],
        });

        const navStepKey = `step-${widget.key}-navigate`;
        flowSteps.push({
          key: navStepKey,
          flowKey,
          stepType: "navigate",
          executionMode: "client_direct",
          bindingKey: navKey,
          description: `Navigate to ${action.targetPageKey ?? "page"}`,
        });
        stepKeys.push(navStepKey);
        break;
      }

      case "invoke_function": {
        // Find the matching function in backend graph
        const matchingFn = backendGraph.functionIntents.find(
          (f) => f.relatedEntityKeys.includes(action.targetEntityKey ?? "")
        );

        if (matchingFn) {
          const fnBindKey = `fn-bind-${widget.key}`;
          functionBindings.push({
            key: fnBindKey,
            actionKey: widget.key,
            functionKey: matchingFn.key,
            invocationMode: matchingFn.kind === "edge_function"
              ? "fire_and_forget"
              : "blocking",
            reason: `Widget triggers ${matchingFn.label}`,
            sourceLinkKeys: [srcLink.key],
          });

          const fnStepKey = `step-${widget.key}-invoke`;
          flowSteps.push({
            key: fnStepKey,
            flowKey,
            stepType: "invoke_function",
            executionMode: matchingFn.kind === "edge_function"
              ? "background"
              : "server_enforced",
            bindingKey: fnBindKey,
            description: `Invoke function: ${matchingFn.label}`,
            onFailure: "show_error_toast",
          });
          stepKeys.push(fnStepKey);
        }
        break;
      }

      default: {
        // For mixed/unknown, generate a basic notify step
        const unknownStepKey = `step-${widget.key}-unknown`;
        flowSteps.push({
          key: unknownStepKey,
          flowKey,
          stepType: "custom",
          executionMode: "unknown",
          description: `Unresolved action: ${action.operation} on widget "${widget.label}"`,
        });
        stepKeys.push(unknownStepKey);
        break;
      }
    }

    // Map the flow type
    const flowType = mapFlowType(action.operation);

    actionFlows.push({
      key: flowKey,
      actionKey: widget.key,
      flowType,
      trigger,
      stepKeys,
      successStateKeys,
      failureStateKeys,
      sourceLinkKeys: [srcLink.key],
    });
  }

  return {
    actionFlows,
    flowSteps,
    mutationBindings,
    uploadBindings,
    navigationBindings,
    functionBindings,
    guards,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inferTrigger(widget: WidgetNode): WiringActionFlow["trigger"] {
  const role = widget.semanticRole;
  if (role === "primary_cta_button" || role === "secondary_button" || role === "icon_button" || role === "fab_button") {
    return "button_press";
  }
  if (role === "file_input") {
    return "file_select";
  }
  if (role === "list_item" || role === "grid_item" || role === "table_row") {
    return "row_select";
  }
  return "button_press";
}

function mapFlowType(operation: string): WiringActionFlow["flowType"] {
  switch (operation) {
    case "create": return "create";
    case "update": return "update";
    case "delete": return "delete";
    case "upload": return "upload";
    case "navigate": return "navigate";
    case "authenticate":
    case "logout": return "authenticate";
    case "invoke_function": return "invoke_async";
    default: return "unknown";
  }
}
