import { DependencyGraph } from '../services/impact/graph';
import { CPMEngine } from '../services/impact/cpm';
import { RiskEngine } from '../services/impact/riskEngine';
import { RecommendationEngine } from '../services/impact/recommendationEngine';
import { SimulatorEngine } from '../services/impact/simulator';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Starting Impact Engine Unit Tests...\n');

  // ── TEST 1: Linear Dependency Chain (A -> B -> C) ──
  {
    console.log('Test 1: Linear dependency chain A -> B -> C');
    const tasks = [
      { _id: 'A', title: 'Task A', estimatedHours: 6, status: 'todo', assignees: [{ _id: 'user1', name: 'Alice' }] },
      { _id: 'B', title: 'Task B', estimatedHours: 12, status: 'todo', dependencies: ['A'], assignees: [{ _id: 'user2', name: 'Bob' }] },
      { _id: 'C', title: 'Task C', estimatedHours: 6, status: 'todo', dependencies: ['B'], assignees: [{ _id: 'user3', name: 'Charlie' }] },
    ];

    const graph = DependencyGraph.fromTasks(tasks);
    assert(graph.nodes.size === 3, 'Graph should have 3 nodes');
    assert(graph.edges.length === 2, 'Graph should have 2 edges');

    const topo = graph.getTopologicalSort();
    assert(topo.indexOf('A') < topo.indexOf('B'), 'A must precede B');
    assert(topo.indexOf('B') < topo.indexOf('C'), 'B must precede C');

    const blastA = graph.getDownstreamBlastRadius('A');
    assert(blastA.downstreamTaskIds.length === 2, 'A should have 2 downstream tasks');
    assert(blastA.downstreamDepth === 2, 'A should have propagation depth of 2');

    const cpm = CPMEngine.calculate(graph);
    assert(cpm.totalProjectDurationDays === 4.0, `Expected 4.0 days, got ${cpm.totalProjectDurationDays}`);
    assert(cpm.criticalPath.includes('A') && cpm.criticalPath.includes('B') && cpm.criticalPath.includes('C'), 'All tasks should be critical in a single linear chain');
    console.log('✅ Test 1 Passed\n');
  }

  // ── TEST 2: Branching & Merging Dependency ──
  {
    console.log('Test 2: Branching (A -> B, A -> C) and Merging (B -> D, C -> D)');
    const tasks = [
      { _id: 'A', title: 'A', estimatedHours: 6, status: 'todo' },
      { _id: 'B', title: 'B (longer)', estimatedHours: 18, dependencies: ['A'], status: 'todo' },
      { _id: 'C', title: 'C (shorter)', estimatedHours: 6, dependencies: ['A'], status: 'todo' },
      { _id: 'D', title: 'D', estimatedHours: 6, dependencies: ['B', 'C'], status: 'todo' },
    ];

    const graph = DependencyGraph.fromTasks(tasks);
    const cpm = CPMEngine.calculate(graph);

    // Path A(1d) -> B(3d) -> D(1d) = 5d total (Critical)
    // Path A(1d) -> C(1d) -> D(1d) = 3d total (Float on C = 2d)
    assert(cpm.totalProjectDurationDays === 5.0, `Expected 5 days duration, got ${cpm.totalProjectDurationDays}`);
    assert(cpm.metrics.get('C')?.slack === 2.0, `Expected 2 days slack on Task C, got ${cpm.metrics.get('C')?.slack}`);
    assert(cpm.metrics.get('C')?.isCritical === false, 'Task C should NOT be on the critical path');
    assert(cpm.metrics.get('B')?.isCritical === true, 'Task B SHOULD be on the critical path');
    console.log('✅ Test 2 Passed\n');
  }

  // ── TEST 3: Cycle Detection (A -> B -> A) ──
  {
    console.log('Test 3: Dependency Cycle Detection');
    const tasks = [
      { _id: 'A', title: 'Task A', estimatedHours: 6, dependencies: ['B'], status: 'todo' },
      { _id: 'B', title: 'Task B', estimatedHours: 6, dependencies: ['A'], status: 'todo' },
    ];

    const graph = DependencyGraph.fromTasks(tasks);
    const cycle = graph.detectCycle();
    assert(cycle.hasCycle === true, 'Cycle should be detected');
    assert(cycle.cyclePath !== undefined && cycle.cyclePath.length >= 2, 'Cycle path should be identified');
    console.log('✅ Test 3 Passed\n');
  }

  // ── TEST 4: Graph with No Dependencies ──
  {
    console.log('Test 4: Standalone tasks without dependencies');
    const tasks = [
      { _id: 'T1', title: 'Task 1', estimatedHours: 12, status: 'todo' },
      { _id: 'T2', title: 'Task 2', estimatedHours: 6, status: 'todo' },
    ];

    const graph = DependencyGraph.fromTasks(tasks);
    const cpm = CPMEngine.calculate(graph);
    assert(cpm.totalProjectDurationDays === 2.0, `Expected max duration 2.0d, got ${cpm.totalProjectDurationDays}`);
    console.log('✅ Test 4 Passed\n');
  }

  // ── TEST 5: What-If Simulation (Effort Increase on Critical Path) ──
  {
    console.log('Test 5: What-If Simulation (Effort Increase on Critical Task)');
    const tasks = [
      { _id: 'A', title: 'Task A', estimatedHours: 6, status: 'todo' },
      { _id: 'B', title: 'Task B', estimatedHours: 6, dependencies: ['A'], status: 'todo' },
    ];

    const graph = DependencyGraph.fromTasks(tasks);
    const sprintEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    // Increase Task A from 6h (1d) to 30h (5d)
    const simResult = SimulatorEngine.simulate(
      graph,
      { taskId: 'A', estimatedHours: 30 },
      new Date(),
      sprintEnd
    );

    assert(simResult.simulatedHealth.healthScore < simResult.baselineHealth.healthScore, 'Health score should drop after effort increase');
    assert(simResult.projectedDelayDeltaDays > 0, 'Projected delay should increase');
    assert(simResult.affectedTasks.length === 1 && simResult.affectedTasks[0]._id === 'B', 'Task B should be affected');

    // Verify original graph is untouched (immutability)
    assert(graph.nodes.get('A')?.estimatedHours === 6, 'Original graph must not be mutated');
    console.log('✅ Test 5 Passed\n');
  }

  // ── TEST 6: Explainable Recommendations for Overloaded Assignee ──
  {
    console.log('Test 6: Recommendation Engine for Overloaded Assignee');
    const tasks = [
      {
        _id: 'A',
        title: 'Heavy Backend Migration',
        estimatedHours: 90, // Over 80h capacity
        status: 'todo',
        assignees: [{ _id: 'u1', name: 'Alice Overworked' }],
      },
      {
        _id: 'B',
        title: 'Quick Doc',
        estimatedHours: 6,
        status: 'todo',
        assignees: [{ _id: 'u2', name: 'Bob Available' }],
      },
    ];

    const graph = DependencyGraph.fromTasks(tasks);
    const cpm = CPMEngine.calculate(graph);
    const workload = RiskEngine.computeWorkload(graph, 10);
    const riskMap = new Map();
    for (const id of graph.nodes.keys()) {
      riskMap.set(id, RiskEngine.evaluateTaskRisk(id, graph, cpm, workload));
    }

    const recs = RecommendationEngine.generate(graph, cpm, riskMap, workload);
    assert(recs.length > 0, 'Should generate at least 1 recommendation');
    assert(recs[0].type === 'reassign', 'Should recommend reassignment');
    assert(recs[0].reason.includes('Bob Available'), 'Reason should cite available engineer');
    console.log('✅ Test 6 Passed\n');
  }

  console.log('🎉 ALL 6 IMPACT ENGINE UNIT TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
