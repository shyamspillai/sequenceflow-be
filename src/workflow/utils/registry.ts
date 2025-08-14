export type ExecutionLog = { kind: 'notification' | 'input' | 'decision'; nodeId: string; name: string; content: string }
export type NodeExecuteResult = { logs: ExecutionLog[]; allowedSourceHandles?: Set<string>; payload?: Record<string, unknown> }
export type NodeExecutor = (base: any, payload: Record<string, unknown>) => NodeExecuteResult

export const nodeExecutors: Record<string, NodeExecutor> = {} 