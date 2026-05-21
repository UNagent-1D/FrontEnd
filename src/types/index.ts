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

export type TenantStatus = 'active' | 'suspended' | 'churned';

export interface Tenant {
  id: string;
  name: string;
  domain?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Optional fields used by parts of the UI that pre-date the backend's
  // current Tenant model. They're tolerated as `undefined` from the API and
  // populated locally (e.g. LoginForm's setTenant call after auth).
  slug?: string;
  plan?: string;
  status?: TenantStatus;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'app_admin' | 'tenant_admin' | 'tenant_operator';
  tenant_id?: string;
  first_name?: string;
  last_name?: string;
}

export interface UserResponse {
  id: string;
  email: string;
  role: Role;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BackendAgentProfile {
  id: string;
  name: string;
  description: string | null;
  scheduling_flow_rules: any;
  escalation_rules: any;
  allowed_specialties: string[];
  allowed_locations: string[];
  agent_config_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackendTool {
  id: string;
  name: string;
  description: string | null;
  openai_function_def: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BackendAgentConfig {
  id: string;
  agent_profile_id: string;
  version: number;
  status: 'draft' | 'active' | 'archived';
  conversation_policy: any;
  escalation_rules: any;
  tool_permissions: Array<{ tool_name: string; constraints?: Record<string, any> }> | null;
  llm_params: any;
  channel_format_rules: any;
  created_by: string | null;
  created_at: string;
  activated_at: string | null;
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
  constraints: z.record(z.string(), z.any()).optional(),
});
export type ToolPermission = z.infer<typeof toolPermissionSchema>;


// ---- LLM & Agent Config ----
export const llmParamsSchema = z.object({
  model: z.enum(['gpt-4o', 'gpt-4o-mini']),
  temperature: z.number().min(0.0).max(2.0),
  max_tokens: z.number().int().positive(),
  system_prompt: z.string().min(10, "The system prompt is too short."),
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
  specialty: z.string().min(1, "Specialty cannot be empty."),
  enabled: z.boolean(),
});
export type SchedulingFlowRule = z.infer<typeof schedulingFlowRuleSchema>;

export const agentProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(3, "The profile name is too short."),
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
  source_type: z.enum(['scheduling', 'patient_registry']),
  base_url: z.string().url(),
  route_configs: z.record(z.string(), routeConfigSchema),
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

// Response from GET /api/v1/sessions/:sid
export interface SessionInfo {
  session_id: string;
  tenant_id: string;
  agent_profile_id: string;
  end_user_id: string;
  channel_type: 'whatsapp' | 'telegram' | 'widget';
  state: SessionState;
  opened_at: string;
  closed_at: string | null;
}

// Response from GET /api/v1/sessions/:sid/history
export interface SessionHistory {
  session_id: string;
  turns: Turn[];
}
