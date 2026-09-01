import { TaskNode, DependencyEdge, BlastRadius, TaskAssignee } from './types';

/**
 * Directed Dependency Graph Representation
 * Models tasks as vertices and blocking dependencies as directed edges (A -> B means A blocks B).
 */
export class DependencyGraph {
  public nodes: Map<string, TaskNode> = new Map();
  public edges: DependencyEdge[] = [];
  public adjList: Map<string, Set<string>> = new Map();      // u -> Set<v> (u blocks v)
  public reverseAdjList: Map<string, Set<string>> = new Map();// v -> Set<u> (v depends on u)
  public inDegree: Map<string, number> = new Map();

  constructor() {}

  /**
   * Initializes graph from raw database task documents.
   */
  public static fromTasks(tasks: any[]): DependencyGraph {
    const graph = new DependencyGraph();

    // 1. Build TaskNode vertices
    for (const raw of tasks) {
      const id = String(raw._id);
      const points = typeof raw.storyPoints === 'number' ? raw.storyPoints : undefined;
      // Default estimated hours: explicit hours OR points * 6 hours OR 6 hours
      const estimatedHours =
        typeof raw.estimatedHours === 'number' && raw.estimatedHours > 0
          ? raw.estimatedHours
          : points && points > 0
          ? points * 6
          : 6;

      const assignees: TaskAssignee[] = (raw.assignees || []).map((a: any) => ({
        _id: String(a._id || a),
        name: a.name || 'Team Member',
        avatar: a.avatar || '',
        email: a.email || '',
      }));

      const node: TaskNode = {
        _id: id,
        title: raw.title || 'Untitled Task',
        type: raw.type || 'task',
        status: (raw.status || 'todo') as any,
        priority: (raw.priority || 'medium') as any,
        storyPoints: points,
        estimatedHours,
        loggedHours: raw.loggedHours || 0,
        assignees,
        dueDate: raw.dueDate ? new Date(raw.dueDate).toISOString() : undefined,
        startDate: raw.startDate ? new Date(raw.startDate).toISOString() : undefined,
        sprintId: raw.sprint ? String(raw.sprint._id || raw.sprint) : undefined,
        predecessorIds: [],
        successorIds: [],
        isBlocked: raw.status === 'blocked',
      };

      graph.nodes.set(id, node);
      graph.adjList.set(id, new Set());
      graph.reverseAdjList.set(id, new Set());
      graph.inDegree.set(id, 0);
    }

    // 2. Extract and link directed dependency edges
    for (const raw of tasks) {
      const taskId = String(raw._id);

      // Predecessors that THIS task depends on (blockedBy, dependencies)
      const predecessorCandidates = new Set<string>();

      (raw.dependencies || []).forEach((dep: any) => {
        const depId = String(dep._id || dep);
        if (depId && depId !== taskId && graph.nodes.has(depId)) {
          predecessorCandidates.add(depId);
        }
      });

      (raw.blockedBy || []).forEach((dep: any) => {
        const depId = String(dep._id || dep);
        if (depId && depId !== taskId && graph.nodes.has(depId)) {
          predecessorCandidates.add(depId);
        }
      });

      // Parent/Subtask relationship (subtask depends on parent)
      if (raw.parent) {
        const parentId = String(raw.parent._id || raw.parent);
        if (parentId && parentId !== taskId && graph.nodes.has(parentId)) {
          predecessorCandidates.add(parentId);
        }
      }

      // Add direct edges: pred -> taskId (pred blocks taskId)
      for (const predId of Array.from(predecessorCandidates)) {
        graph.addEdge(predId, taskId, 'blocks');
      }
    }

    return graph;
  }

  /**
   * Adds a directed edge: from -> to (from blocks to)
   */
  public addEdge(from: string, to: string, type: 'blocks' | 'parent' | 'subtask' | 'linked' = 'blocks'): boolean {
    if (!this.nodes.has(from) || !this.nodes.has(to) || from === to) return false;

    const fromSet = this.adjList.get(from)!;
    if (fromSet.has(to)) return false; // Edge already exists

    fromSet.add(to);
    this.reverseAdjList.get(to)!.add(from);
    this.inDegree.set(to, (this.inDegree.get(to) || 0) + 1);

    this.nodes.get(from)!.successorIds.push(to);
    this.nodes.get(to)!.predecessorIds.push(from);

    this.edges.push({ from, to, type });
    return true;
  }

  /**
   * Detects cycles in the dependency graph using Kahn's algorithm and DFS.
   * Returns { hasCycle: boolean, cyclePath?: string[] }
   */
  public detectCycle(): { hasCycle: boolean; cyclePath?: string[] } {
    const inDegrees = new Map(this.inDegree);
    const queue: string[] = [];

    for (const [nodeId, deg] of inDegrees.entries()) {
      if (deg === 0) queue.push(nodeId);
    }

    let visitedCount = 0;
    while (queue.length > 0) {
      const u = queue.shift()!;
      visitedCount++;

      for (const v of this.adjList.get(u) || []) {
        const nextDeg = inDegrees.get(v)! - 1;
        inDegrees.set(v, nextDeg);
        if (nextDeg === 0) {
          queue.push(v);
        }
      }
    }

    const hasCycle = visitedCount < this.nodes.size;
    if (!hasCycle) return { hasCycle: false };

    // Trace cycle using DFS for explainability
    const cycleNodes = Array.from(inDegrees.entries())
      .filter(([_, deg]) => deg > 0)
      .map(([id]) => id);

    const visitedState = new Map<string, 'unvisited' | 'visiting' | 'visited'>();
    const parentMap = new Map<string, string>();
    let cyclePath: string[] = [];

    const dfs = (curr: string): boolean => {
      visitedState.set(curr, 'visiting');
      for (const neighbor of this.adjList.get(curr) || []) {
        if (!cycleNodes.includes(neighbor)) continue;

        if (visitedState.get(neighbor) === 'visiting') {
          // Found cycle back-edge
          cyclePath = [neighbor, curr];
          let p = parentMap.get(curr);
          while (p && p !== neighbor) {
            cyclePath.push(p);
            p = parentMap.get(p);
          }
          cyclePath.push(neighbor);
          cyclePath.reverse();
          return true;
        }

        if (!visitedState.has(neighbor) || visitedState.get(neighbor) === 'unvisited') {
          parentMap.set(neighbor, curr);
          if (dfs(neighbor)) return true;
        }
      }
      visitedState.set(curr, 'visited');
      return false;
    };

    for (const node of cycleNodes) {
      if (!visitedState.has(node) && dfs(node)) break;
    }

    return { hasCycle: true, cyclePath: cyclePath.length > 0 ? cyclePath : cycleNodes.slice(0, 5) };
  }

  /**
   * Performs Kahn's algorithm topological sorting.
   * Returns list of task IDs in valid execution order.
   */
  public getTopologicalSort(): string[] {
    const inDegrees = new Map(this.inDegree);
    const queue: string[] = [];
    const sortedOrder: string[] = [];

    for (const [nodeId, deg] of inDegrees.entries()) {
      if (deg === 0) queue.push(nodeId);
    }

    while (queue.length > 0) {
      const u = queue.shift()!;
      sortedOrder.push(u);

      for (const v of this.adjList.get(u) || []) {
        const nextDeg = inDegrees.get(v)! - 1;
        inDegrees.set(v, nextDeg);
        if (nextDeg === 0) {
          queue.push(v);
        }
      }
    }

    // Append any unvisited nodes in case of cycle
    if (sortedOrder.length < this.nodes.size) {
      for (const id of this.nodes.keys()) {
        if (!sortedOrder.includes(id)) {
          sortedOrder.push(id);
        }
      }
    }

    return sortedOrder;
  }

  /**
   * Computes downstream blast radius for a given task using BFS.
   * Calculates all dependent tasks, max propagation depth, and affected engineers.
   */
  public getDownstreamBlastRadius(taskId: string): BlastRadius {
    if (!this.nodes.has(taskId)) {
      return {
        downstreamTaskIds: [],
        upstreamTaskIds: [],
        downstreamDepth: 0,
        affectedEngineers: [],
        propagationDelayDays: 0,
      };
    }

    // Downstream BFS
    const downstreamSet = new Set<string>();
    const engineerMap = new Map<string, TaskAssignee>();
    const depthMap = new Map<string, number>();
    depthMap.set(taskId, 0);

    const queue: string[] = [taskId];
    let maxDepth = 0;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currDepth = depthMap.get(curr) || 0;

      for (const next of this.adjList.get(curr) || []) {
        if (!downstreamSet.has(next)) {
          downstreamSet.add(next);
          const nextDepth = currDepth + 1;
          depthMap.set(next, nextDepth);
          if (nextDepth > maxDepth) maxDepth = nextDepth;
          queue.push(next);

          const nextNode = this.nodes.get(next);
          if (nextNode) {
            nextNode.assignees.forEach((a) => {
              if (a._id) engineerMap.set(a._id, a);
            });
          }
        }
      }
    }

    // Upstream BFS
    const upstreamSet = new Set<string>();
    const upQueue: string[] = [taskId];
    while (upQueue.length > 0) {
      const curr = upQueue.shift()!;
      for (const prev of this.reverseAdjList.get(curr) || []) {
        if (!upstreamSet.has(prev)) {
          upstreamSet.add(prev);
          upQueue.push(prev);
        }
      }
    }

    const taskNode = this.nodes.get(taskId)!;
    const taskDurationDays = taskNode.estimatedHours / 6;

    return {
      downstreamTaskIds: Array.from(downstreamSet),
      upstreamTaskIds: Array.from(upstreamSet),
      downstreamDepth: maxDepth,
      affectedEngineers: Array.from(engineerMap.values()),
      propagationDelayDays: Math.round(taskDurationDays * (maxDepth > 0 ? 1 : 0) * 10) / 10,
    };
  }

  /**
   * Creates a deep in-memory copy of the graph for simulation.
   */
  public clone(): DependencyGraph {
    const copy = new DependencyGraph();
    for (const [id, node] of this.nodes.entries()) {
      copy.nodes.set(id, {
        ...node,
        assignees: node.assignees.map((a) => ({ ...a })),
        predecessorIds: [...node.predecessorIds],
        successorIds: [...node.successorIds],
      });
      copy.adjList.set(id, new Set(this.adjList.get(id)));
      copy.reverseAdjList.set(id, new Set(this.reverseAdjList.get(id)));
      copy.inDegree.set(id, this.inDegree.get(id) || 0);
    }
    copy.edges = this.edges.map((e) => ({ ...e }));
    return copy;
  }
}
