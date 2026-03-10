import { z } from 'zod';

// ==================================================================
// BASE TENANT & USER TYPES
// ==================================================================
export type Role = 'app_admin' | 'tenant_admin' | 'tenant_operator';

export interface User {
  id: string;
  email: string;
  role: Role;
  tenant_id: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  branding_logo_url?: string;
  branding_primary_color?: string;
}

// ==================================================================
// AGENT & CONFIGURATION TYPES (ACR & Tenant Service)
// ==================================================================

// ---- Tool Registry ----
export interface Tool {
  id: string;
  name: string;
  description: string;
  openai_function_def: any; // Can be detailed further if needed
  is_active: boolean;
}

export const toolPermissionSchema = z.object({
  tool_name: z.string(),
  constraints: z.record(z.any()).optional(),
});
export type ToolPermission = z.infer<typeof toolPermissionSchema>;


// ---- LLM & Agent Config ----
export const llmParamsSchema = z.object({
  model: z.enum(['gpt-4o', 'gpt-4o-mini']),
  temperature: z.number().min(0.0).max(2.0),
  max_tokens: z.number().int().positive(),
  system_prompt: z.string().min(10, "El prompt del sistema es demasiado corto."),
});
export type LlmParams = z.infer<typeof llmParamsSchema>;

export const agentConfigSchema = z.object({
  id: z.string().uuid(),
  version: z.number().int(),
  status: z.enum(['draft', 'active', 'archived']),
  llm_params: llmParamsSchema,
  tool_permissions: z.array(toolPermissionSchema),
});
export type AgentConfig = z.infer<typeof agentConfigSchema>;


// ---- Business Logic Profile ----
export const schedulingFlowRuleSchema = z.object({
  id: z.string().uuid(),
  specialty: z.string().min(1, "La especialidad no puede estar vacía."),
  enabled: z.boolean(),
});
export type SchedulingFlowRule = z.infer<typeof schedulingFlowRuleSchema>;

export const agentProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, "El nombre del perfil es demasiado corto."),
  description: z.string().optional(),
  allowed_specialties: z.array(z.string()),
  allowed_locations: z.array(z.string()),
  // `scheduling_flow_rules` and `escalation_rules` are also here as JSONB
  // For the form, we'll keep them separate for now.
  agent_config_id: z.string().uuid().optional(), // The active config
});
export type AgentProfile = z.infer<typeof agentProfileSchema>;


// ==================================================================
// DATA SOURCES TYPES
// ==================================================================
export const routeConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PATCH', 'DELETE']),
  path: z.string(),
});
export type RouteConfig = z.infer<typeof routeConfigSchema>;

export const dataSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  base_url: z.string().url(),
  route_configs: z.record(routeConfigSchema),
});
export type DataSource = z.infer<typeof dataSourceSchema>;


// ==================================================================
// CONVERSATION SERVICE TYPES
// ==================================================================
export type TurnRole = 'user' | 'assistant' | 'tool';
export type SessionState = 'bot_active' | 'escalation_pending' | 'operator_active' | 'closed';
export type EscalationReason = 'confused' | 'angry' | 'ask_for_human';

export interface Turn {
  role: TurnRole;
  content?: string;
  ts: string;
  channel_key?: string;
  message_id?: string;
  tool_name?: string;
  result?: Record<string, unknown>;
}

export interface StructuredLlmOutput {
  action: 'none' | 'tool_call' | 'escalate' | 'close_session';
  message: {
    text: string;
    escalation?: {
      reason: EscalationReason;
      operator_note: string;
    };
    tool?: {
      tool_name: string;
      parameters: Record<string, unknown>;
    };
  };
}

// Simplified version of the full ContextEnvelope for frontend use
export interface ContextEnvelope {
  session_id: string;
  session_meta: {
    channel_type: 'whatsapp' | 'telegram' | 'widget';
    welcome_message: string;
  };
  end_user: {
    id: string;
    full_name: string;
    cellphone: string;
  };
  tenant_policy: {
    tenant_id: string;
  };
}

export interface Session {
  _id: string;
  tenant_id: string;
  agent_profile_id: string;
  end_user_id: string;
  channel_type: 'whatsapp' | 'telegram' | 'widget';
  state: SessionState;
  context_envelope: ContextEnvelope;
  turns: Turn[];
  opened_at: string;
  closed_at: string | null;
}
