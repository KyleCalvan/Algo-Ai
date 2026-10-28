import { fullLesson, section } from './fullLessonHelpers';
import type { Lesson } from './lessons';

const analysis = fullLesson({
  moduleId: 'GROUP 2 - ALGORITHM ANALYSIS', title: 'Algorithm Analysis: Time, Space, and Asymptotic Bounds', difficulty: 'Intermediate',
  description: 'A complete analysis workflow: define input size, count operations, compare cases, prove upper/lower bounds, and account for live memory.',
  objectives: ['Distinguish time from space complexity.', 'Analyze best, average, and worst cases.', 'Apply all five asymptotic notations.', 'Derive loop and recursion bounds with explicit assumptions.'],
  sections: [
    section('What analysis measures and why', `Algorithm analysis models the resources needed as input size grows. A seven-element loop performs seven iterations, but the important question is how that count changes when the length becomes n. If it performs a fixed amount of work per item, its count has the form an+b and grows linearly.

Time complexity counts operations; space complexity counts memory. These abstractions allow comparisons across machines, although actual performance also depends on implementation and hardware. Define n and the counted operation before stating a class. For graphs, retain V and E; for two independent arrays, retain n and m.

A complete answer combines reasoning with a bound. “O(n)” without an input definition or derivation is a label rather than an analysis.`),
    section('Best, average, and worst case: one complete search example', `For linear search in [2,5,3,1,4], finding 2 takes one comparison, finding 3 takes three, and finding 4 takes five. An absent key also takes five. The best successful position is first, while last or missing supplies a worst case.

If every successful position is equally likely, expected comparisons are (1+2+3+4+5)/5=3. For length n, this becomes (n+1)/2, still Θ(n). “Average” requires a distribution; the middle position alone is not a proof of average performance. Including unsuccessful searches changes the expectation according to their probability.

A worst-case guarantee limits every size-n input. An average-case claim describes an expectation under assumptions. Neither statement should be silently substituted for the other when selecting an algorithm.`, {
      example: { problem: 'Find target 1 in [2,5,3,1,4].', steps: ['Compare 2, then 5, then 3: all fail.', 'The fourth comparison matches 1.', 'Stop immediately; element 4 is not inspected.'], answer: '4 comparisons for this input. This instance does not change the general Θ(n) worst-case or uniform-success average bound.' },
    }),
    section('Proving Big-O, Big-Omega, and Big-Theta', `For nonnegative eventual costs, f=O(g) requires a positive c and threshold n₀ such that f(n)≤c·g(n) for all n≥n₀. Big-Omega reverses the inequality. Big-Theta requires both, possibly using different constants.

For f(n)=5n+3, choose n₀=1. Then 5n≤5n+3≤8n, proving Θ(n). You may also say O(n²), but that is a looser statement. A lower bound on one algorithm’s work is different from a lower bound on every possible algorithm solving a problem.

Notation is independent of input cases. You can bound a best-case, worst-case, or expected-cost function using O, Ω, or Θ. Equating Big-O with “worst” and Ω with “best” confuses two separate dimensions.`),
    section('Little-o and little-omega: strict growth separation', `Little-o is a strict asymptotic upper relation: for every c>0, eventually f(n)<c·g(n). Little-omega is strict lower growth: for every c>0, eventually f(n)>c·g(n). The threshold may depend on c.

For positive functions, a ratio tending to zero proves little-o; a ratio tending to infinity proves little-omega. Thus n=o(n²) and n²=ω(n). But 5n is neither o(n) nor ω(n), because the ratio remains 5. It is Θ(n).

A single strict inequality is insufficient. For c=10, n²>10n begins at n=11, but the ω proof must work for every positive c, with a suitable threshold. This quantifier is the essential distinction, not merely replacing ≤ with < in a finite table.`),
    section('Count sequential, nested, and changing-size work', `Sequential phases add: two scans cost an+bn, hence Θ(n). Two independent n-iteration loops nested together give n² executions. The triangular loop j<i gives n(n−1)/2 executions. If a loop doubles its counter, it executes Θ(log n) times rather than Θ(n).

Dependencies matter. For i=1,2,4,…≤n, an inner loop of i steps gives a geometric sum Θ(n), despite appearing nested. Conversely, a full n-scan at every such level gives Θ(n log n).

Recursive analysis writes the same counting idea as a recurrence. Binary search has T(n)=T(n/2)+Θ(1); merge sort has T(n)=2T(n/2)+Θ(n). Include the nonrecursive work and base case, rather than counting only the number of self-calls.`, {
      code: '# Triangular work: 0 + 1 + ... + (n-1)\nfor i in range(n):\n    for j in range(i):\n        process_pair(i, j)\n\n# Doubling: logarithmically many updates\ni = 1\nwhile i < n:\n    i *= 2',
    }),
    section('Memory, amortization, and a practical report', `A scan using one accumulator needs O(1) auxiliary words. A copied array needs O(n). Recursive stack frames also count: n frames of constant size use O(n) extra space. Count peak simultaneously live storage, not every allocation added together when storage is later reused.

Amortized analysis concerns a sequence: geometric dynamic-array growth occasionally causes linear copying, but the total copying across n appends is O(n), so append is O(1) amortized. This is not an average over random inputs and does not remove a single append’s worst-case cost.

Report assumptions, input size, operation count, case, tight time bound when known, and auxiliary space. Then benchmark realistic data to understand constants, locality, and allocation costs. A lower growth class is valuable for scale, but does not establish a concrete runtime without a resource model.`),
  ],
  summary: 'Define the input, count the work, select the relevant case, prove a growth bound, and measure peak extra memory. O/Ω/Θ and o/ω are asymptotic relations, while best/average/worst/amortized describe different resource questions.',
  reviewer: {
    keyFacts: ['Time counts operations; space counts live storage.', 'Average-case analysis needs an input distribution.', 'Θ supplies both upper and lower constant-factor bounds.', 'Little-o and little-omega quantify over every positive constant.', 'A triangular double loop is Θ(n²).', 'Recursion stack and resizing costs belong in the analysis.'],
    questions: [
      { question: 'Prove 5n+3=Θ(n).', answer: 'For n≥1, 5n≤5n+3≤8n. Constants 5 and 8 provide lower and upper bounds, with threshold 1.' },
      { question: 'How do Ω(n) and ω(n) differ?', answer: 'Ω permits equal growth within a constant factor. ω requires growth faster than every constant multiple eventually. 5n is Ω(n) but not ω(n).' },
      { question: 'Why is uniform successful linear-search average Θ(n)?', answer: 'Expected comparisons are (1+…+n)/n=(n+1)/2. Dropping a factor and additive constant leaves linear growth.' },
      { question: 'Why count recursive frames?', answer: 'Every active call retains state until it returns. Explicit arrays are not the only source of auxiliary memory.' },
    ],
    exercises: [
      { problem: 'Classify n²+4n, log₂n, and 2ⁿ relative to n.', solution: 'n²+4n is ω(n); log₂n is o(n); 2ⁿ is ω(n). None is Θ(n). Their ratios to n tend to infinity, zero, and infinity respectively.' },
      { problem: 'An n-scan uses an output copy plus a running maximum. Give time and auxiliary space.', solution: 'Θ(n) time and Θ(n) extra space because of the copy. The constant-sized maximum variable does not dominate the storage.' },
      { problem: 'Outer loop runs n times; inner runs m times. May you conclude Θ(n²)?', solution: 'Only if m=Θ(n) is established. With independent sizes the tight bound is Θ(nm) for constant-time bodies.' },
    ],
  },
});

const recurrences = fullLesson({
  moduleId: 'GROUP 3 - RECURRENCE RELATIONS', title: 'Recurrence Relations: From Recursive Code to a Bound', difficulty: 'Intermediate',
  description: 'Develop and solve recurrences through expansion, induction-based substitution, recursion trees, and the Master theorem.',
  objectives: ['Identify recurrence terms and base cases.', 'Apply the four solving methods.', 'Work through linear, logarithmic, and divide-and-conquer examples.', 'Recognize when a theorem does not apply.'],
  sections: [
    section('Sequences, recursive cost, and initial conditions', `A recurrence defines a quantity using earlier or smaller quantities. Fibonacci uses F(n)=F(n−1)+F(n−2), F(0)=0, F(1)=1. Compound growth uses Aₙ=(1+r)Aₙ₋₁ with a starting amount A₀. The initial conditions select a particular solution.

For algorithm cost, T(n) is work on size n. Count how many recursive calls occur, their sizes, and work outside those calls. One half-size call plus constant work gives T(n)=T(n/2)+Θ(1). Two half-size calls plus a linear merge give T(n)=2T(n/2)+Θ(n).

A recurrence models behavior under assumptions. Slicing, uneven partitions, or expensive arithmetic can change it. State whether n is a power of two for a simplified derivation, then explain the effect of floors and ceilings on the final bound.`),
    section('Method 1: iteration or repeated expansion', `Expansion repeatedly replaces the recursive term until reaching the base case. For T(n)=T(n−1)+2 with T(1)=4, substitute again to obtain T(n)=T(n−2)+4. After k substitutions, T(n)=T(n−k)+2k.

Set n−k=1, so k=n−1. The answer is 4+2(n−1)=2n+2, hence Θ(n). Including the base value matters for an exact formula even when it does not change the class.

For T(n)=T(n/2)+1, each expansion removes a factor two. With n=2ᵏ and T(1)=1, there are log₂n reductions, giving T(n)=1+log₂n. The stopping condition follows from the shrinking argument, not from an arbitrary number of substitutions.`, {
      example: { problem: 'Compute T(5) for T(n)=T(n−1)+2, T(1)=4.', steps: ['T(2)=6; T(3)=8; T(4)=10.', 'T(5)=12.', 'General expansion: T(n)=4+2(n−1).'], answer: 'T(5)=12; exact formula 2n+2; asymptotic bound Θ(n).' },
    }),
    section('Method 2: substitution means guess and prove', `In the substitution method, first guess a bound and prove it by induction. For T(n)=T(n/2)+1, suppose T(k)≤c log₂k+d for smaller k. Then T(n)≤c log₂(n/2)+d+1=c log₂n+d+(1−c), which fits the desired bound when c≥1 and d handles the base case.

The inductive hypothesis may only be used on smaller arguments. Check the base cases explicitly and choose constants that make every step valid. A guessed formula supported by a few numbers is evidence, not a proof.

For a tight Θ bound, establish both upper and lower bounds or derive an exact formula. Sometimes a first guess fails because the inductive statement needs an extra lower-order term. Strengthening the hypothesis is valid; changing an inequality without justification is not.`),
    section('Method 3: a recursion tree counts level costs', `A recursion tree draws one node per subproblem and labels its nonrecursive work. For T(n)=2T(n/2)+n, level 0 costs n. Level 1 has two subproblems costing n/2 each, so total n. Level i has 2ⁱ nodes, each costing n/2ⁱ, again total n.

There are log₂n non-base levels, giving n log₂n internal work. At the leaf level, n constant-cost base cases contribute Θ(n). The total is Θ(n log n).

A tree’s height alone does not determine time: it must be combined with the number of nodes and cost per node. It is especially useful for distinguishing top-heavy, equal-per-level, and leaf-heavy recurrences. Add the level costs rather than multiplying arbitrary totals.`, {
      code: 'T(n) = 2T(n/2) + n\nlevel 0: 1 × n       = n\nlevel 1: 2 × (n/2)   = n\nlevel 2: 4 × (n/4)   = n\n...\nleaves: n × Θ(1)     = Θ(n)\ntotal: Θ(n log n)',
    }),
    section('Method 4: Master theorem and its conditions', `For T(n)=aT(n/b)+f(n), with a≥1, b>1, and standard regularity assumptions, compare f(n) with nᵖ where p=log_b a. In case 1, f(n)=O(nᵖ⁻ᵋ) for some ε>0, and T(n)=Θ(nᵖ). In case 2, f(n)=Θ(nᵖ logᵏn) with k≥0 in the common extended version, giving Θ(nᵖ logᵏ⁺¹n).

In case 3, f(n)=Ω(nᵖ⁺ᵋ) for some ε>0 and a·f(n/b)≤c·f(n) eventually for some c<1. Then T(n)=Θ(f(n)). The regularity condition prevents pathological oscillating work from invalidating the result.

For 2T(n/2)+n, p=1 and case 2 yields Θ(n log n). For 2T(n/2)+n², case 3 applies because 2(n/2)²=n²/2, yielding Θ(n²). State the applicable case, not just the answer.`),
    section('When the theorem does not fit, and how to check', `T(n)=T(n−1)+n does not have fixed-factor shrinking subproblems, so the standard Master theorem is not the tool. Expansion gives n+(n−1)+…+1=Θ(n²). T(n)=T(n/3)+T(2n/3)+n has unequal subproblem sizes and also needs another argument, such as a suitable recursion-tree analysis.

The recurrence for Fibonacci values is not the same as the recurrence for naive Fibonacci’s running time. The time recurrence includes the work to combine answers and counts repeated calls; memoization changes that evaluation structure.

Check small values, base cases, growth direction, and agreement with code. Be cautious about claims such as “n log n is always instant”: asymptotic class does not fix constants, data size, memory traffic, or hardware. A solved recurrence informs feasibility without being a stopwatch.`),
  ],
  summary: 'Write a recurrence from the actual recursive work and base cases. Expansion finds a sum, substitution proves a guess, recursion trees sum level costs, and the Master theorem handles suitable fixed-factor divide-and-conquer forms.',
  reviewer: {
    keyFacts: ['Base conditions select the solution.', 'Expansion replaces terms; substitution proves a guessed bound.', 'Recursion-tree work = sum of all node costs.', 'Master comparator is n^(log_b a).', 'Case 3 needs polynomial dominance and regularity.', 'T(n−1) is not the standard Master form.'],
    questions: [
      { question: 'What is missing from T(n)=2T(n/2) as a merge-sort model?', answer: 'The linear merge work and the constant-size base case. A proper model is T(n)=2T(n/2)+Θ(n), T(1)=Θ(1).' },
      { question: 'Why is recursion depth not enough to determine time?', answer: 'There may be many subproblems at each depth. Time sums all work across nodes; stack space follows simultaneously active calls.' },
      { question: 'How does the Master theorem solve 4T(n/2)+n?', answer: 'p=log₂4=2. Linear f(n) is polynomially smaller than n², so case 1 gives Θ(n²).' },
      { question: 'When should you avoid using the Master theorem?', answer: 'When the recurrence lacks the required fixed a and b structure or falls outside the stated cases and conditions. Use expansion, induction, trees, or an appropriate general theorem instead.' },
    ],
    exercises: [
      { problem: 'Solve T(n)=T(n−1)+n with T(1)=1.', solution: 'Expand to 1+2+…+n=n(n+1)/2, giving Θ(n²). The additive reduction is not the standard Master form.' },
      { problem: 'Solve T(n)=8T(n/2)+n² by Master theorem.', solution: 'p=log₂8=3, and n² is polynomially smaller than n³. Case 1 yields Θ(n³).' },
      { problem: 'For T(n)=2T(n/2)+n and n=8, list internal level work.', solution: 'Level costs are 8; 2×4=8; 4×2=8. There are 8 constant-cost leaves. Total is Θ(8 log₂8) for this instance and Θ(n log n) generally.' },
    ],
  },
});

const design = fullLesson({
  moduleId: 'GROUP 4 - ALGORITHM DESIGN TECHNIQUES', title: 'Algorithm Design Techniques', difficulty: 'Intermediate',
  description: 'Develop solutions with divide and conquer, greedy choice, dynamic programming, backtracking, and branch and bound, and justify why each works.',
  objectives: ['Identify the structure suited to each design technique.', 'Derive recurrences and state transitions.', 'Explain greedy correctness and counterexamples.', 'Trace pruning and reconstruct solutions.'],
  sections: [
    section('From a problem statement to a design', `Before selecting a technique, identify the inputs, valid outputs, objective, constraints, and required guarantee. Finding any feasible schedule is different from minimizing its completion time. An exact answer, an approximation, and a heuristic output have different contracts.

Inspect structure. Can the problem be split into independent parts? Does a locally best choice remain compatible with an optimum? Do smaller states repeat? Can infeasible partial choices be rejected early? These questions distinguish divide and conquer, greedy, dynamic programming, and search.

Correctness and cost are separate. A fast greedy rule may fail to optimize the objective, while an exact exhaustive method may be too slow. A complete design states an invariant or recurrence, explains why it solves the task, and analyzes time and memory.`),
    section('Divide and conquer: independent pieces', `Divide and conquer divides an instance, solves smaller parts, and combines their results. Finding the maximum of [8,3,5,2,7,4] splits into [8,3,5] and [2,7,4], finds maxima 8 and 7, then compares them. With constant combination work, the recurrence is 2T(n/2)+Θ(1), giving Θ(n).

Merge sort uses the same binary splitting but combines with a linear merge, producing Θ(n log n). The comparison shows why counting recursive calls alone is insufficient: combination work changes the recurrence.

Base cases must be directly solvable. Subproblems should genuinely shrink, and the combination must preserve the required property. Independent subproblems need no cache to avoid repeated identical work; if extensive overlap exists, dynamic programming may be more appropriate.`),
    section('Greedy: commit to a locally best choice', `A greedy algorithm commits to a choice without reconsidering it. Earliest-finish activity selection chooses the compatible activity ending soonest, then repeats. The objective is the largest number of nonoverlapping activities, not necessarily maximum total duration or value.

An exchange argument proves the rule: replace an optimal schedule’s first activity by the earliest-finishing one. The replacement finishes no later, so it leaves at least as much room for subsequent activities. Repeating the reasoning preserves optimality.

Without such a property, a locally appealing choice can fail. For coins {1,3,4} and target 6, largest-first chooses 4+1+1, but 3+3 uses fewer coins. Testing finds this counterexample; testing alone would not prove a greedy rule correct for every possible input.`),
    section('Dynamic programming: state, transition, base, order', `Dynamic programming reuses smaller answers when subproblems overlap. Define precisely what one state means, how smaller states determine it, the base states, and a valid evaluation order. Memoization evaluates requested states recursively; tabulation builds them bottom-up.

For minimum coin change, dp[a] is the fewest coins totaling amount a. Set dp[0]=0 and dp[a]=1+min(dp[a−c]) over usable coins c. Unreachable amounts stay infinite. With m coin types and target A, tabulation takes O(mA) time and O(A) space. This is polynomial in A, which can be large compared with its binary representation length.

Store a chosen predecessor when an actual solution is required, not just the optimal value. Reconstruct by walking those choices backward. An answer table and a reconstructed solution answer related but distinct questions.`, {
      example: { problem: 'Minimum coins for 6 using {1,3,4}.', steps: ['dp[0]=0; dp[1]=1; dp[2]=2.', 'dp[3]=1 using coin 3; dp[4]=1 using 4.', 'dp[5]=2; dp[6]=min(dp[5]+1, dp[3]+1, dp[2]+1)=2.'], answer: 'Two coins: 3+3. This is better than greedy’s three coins.' },
      code: 'def min_coins(coins, amount):\n    dp = [0] + [float("inf")] * amount\n    for value in range(1, amount+1):\n        for coin in coins:\n            if 0 < coin <= value:\n                dp[value] = min(dp[value], dp[value-coin]+1)\n    return dp[amount]',
    }),
    section('0/1 knapsack and the direction of updates', `In 0/1 knapsack, each item can be used at most once. Let DP[i,w] be the best value from the first i items under capacity w. Either exclude item i or include it if it fits: max(DP[i−1,w], valueᵢ+DP[i−1,w−weightᵢ]). The dependency on the previous item row enforces the single-use rule.

A one-dimensional implementation can reduce storage to O(W), but capacities must be processed downward for each item. Upward updates can reuse the same item’s freshly updated state, accidentally solving an unbounded variant.

The standard integer-capacity algorithm takes O(nW) time. This is called pseudopolynomial because W is a numeric value, not its bit-length. State definitions and evaluation order are part of correctness, not merely implementation choices.`),
    section('Backtracking and branch and bound', `Backtracking chooses part of a candidate, checks constraints, recursively extends it, and undoes the choice before exploring another branch. N-Queens rejects partial boards with shared columns or diagonals. Pruning an already-infeasible board is safe because no extension repairs the violation.

Branch and bound handles optimization. Keep the best complete solution found and compute an optimistic bound for each partial branch. For minimization, if a branch’s lower bound is no better than the current best cost, it can be discarded when only a better optimum is sought. An invalid overestimate used as a lower bound can wrongly prune the true optimum.

Both methods can remain exponential in the worst case. Better candidate ordering and stronger valid bounds may reduce explored work without changing the guarantee. Exact search and heuristic search must not be conflated.`),
    section('Compare techniques by evidence', `Divide and conquer fits independently solvable parts. Dynamic programming fits reusable state answers. Greedy requires a safe-commit property. Backtracking fits constrained candidate construction; branch and bound adds optimization-based pruning.

Optimal substructure means optimal solutions can be built from appropriate optimal subsolutions. It is useful but does not by itself prove that an arbitrary greedy choice is safe. Repeated states motivate caching, but choosing an incorrect state representation can merge subproblems that are not equivalent.

When presenting a solution, state the contract, structural reason for the technique, recurrence or invariant, a worked trace, a correctness argument, and resource bounds. Include a counterexample to a tempting wrong method when it explains why the selected technique is necessary.`),
  ],
  summary: 'The design follows the problem’s structure and guarantee. Independent splits favor divide and conquer; overlapping states favor DP; safe local choices permit greedy; constrained search uses backtracking and valid bounds. State definitions and proofs are as important as code.',
  reviewer: {
    keyFacts: ['Divide, conquer, combine; combination cost affects complexity.', 'Greedy needs a safe-choice proof.', 'DP needs state, transition, base, and order.', '0/1 knapsack updates capacity downward in one dimension.', 'Backtracking prunes infeasibility; branch and bound prunes by objective bounds.', 'Optimal substructure alone does not justify every greedy rule.'],
    questions: [
      { question: 'Why does greedy coin change fail for {1,3,4} at 6?', answer: 'Largest-first chooses 4+1+1, three coins. The optimum is 3+3, two coins. The local choice 4 prevents the optimal combination.' },
      { question: 'Why update 0/1 knapsack capacities downward?', answer: 'Every transition must read the previous-item state. Descending order prevents an item’s newly updated state from being reused again during the same item iteration.' },
      { question: 'How does an exchange argument prove a greedy choice safe?', answer: 'It transforms an optimum into one containing the greedy choice without worsening the objective, then applies the reasoning to the remaining subproblem.' },
      { question: 'What makes a branch-and-bound prune correct?', answer: 'The bound must be optimistic in the right direction. For minimization, a valid lower bound at least the current best proves that branch cannot improve the incumbent.' },
    ],
    exercises: [
      { problem: 'Find the maximum of [8,3,5,2,7,4] by dividing into two halves.', solution: 'Left maximum is 8; right maximum is 7; combine with max(8,7)=8. Every input must be considered, giving Θ(n) time.' },
      { problem: 'Capacity 4; one item has weight 2 and value 3. What wrong answer can an upward 0/1 DP produce?', solution: 'It can set dp[2]=3 and later dp[4]=dp[2]+3=6, using the same item twice. The correct 0/1 optimum is 3.' },
      { problem: 'Current best minimization solution costs 20. Branch lower bounds are 15 and 23. Which is safely pruned?', solution: 'The 23 branch cannot beat 20 and may be pruned. The 15 branch may contain a better solution and must remain unless another valid constraint rejects it.' },
    ],
  },
});

const graphs = fullLesson({
  moduleId: 'GROUP 5 - GRAPH ALGORITHM', title: 'Graph Algorithms: Traversal, Paths, and Spanning Trees', difficulty: 'Intermediate',
  description: 'Work through BFS, DFS, topological order, shortest-path methods, and MST algorithms while distinguishing their objectives and guarantees.',
  objectives: ['Trace BFS and DFS.', 'Reconstruct unweighted and weighted shortest paths.', 'Choose among Dijkstra, Bellman-Ford, and Floyd-Warshall.', 'Build and justify an MST using Prim or Kruskal.'],
  sections: [
    section('Define the graph problem before choosing the algorithm', `Vertices model entities and edges model relationships. Edges may be directed, undirected, weighted, or unweighted. A traversal asks what is reachable; a shortest path minimizes route weight; a spanning tree connects all vertices with no cycles. These are different objectives.

Adjacency lists use O(V+E) storage and suit sparse graphs. Matrices use O(V²) and permit direct edge lookup. Representation changes neighbor-scan costs, so it belongs in the analysis.

For every problem, specify the source, whether all vertices must be covered, whether weights may be negative, and whether the desired output is a path, distances, tree, or order. A familiar algorithm name is not enough to show that it solves the requested task.`),
    section('BFS and the source module’s graph', `Use undirected edges A–B, A–C, A–D, B–E, B–F, C–G, C–H, D–H. With alphabetical neighbors, BFS starts with [A], then enqueues B,C,D. Processing B appends E,F; C appends G,H; D does not add H again because it was already discovered.

The resulting order is A,B,C,D,E,F,G,H. Distances from A are 1 for B,C,D and 2 for E,F,G,H. The parent of H is C under this discovery order; A→D→H is another equally short route, but one parent map records only one selected shortest path.

A FIFO queue guarantees distance layers. Mark on enqueue to avoid duplicate copies. Adjacency-list time is O(V+E), with O(V) auxiliary storage for queue and maps.`),
    section('DFS, cycles, and topological ordering', `DFS explores an unvisited branch to completion before returning. With alphabetical neighbors on the source graph, it follows A,B,E,F,C,G,H,D. The exact order depends on neighbor order; it need not match BFS or produce shortest routes.

For directed cycle detection, distinguish active from finished vertices. An edge to an active ancestor proves a cycle. In a simple undirected graph, ignore the parent edge when testing for a visited neighbor. For disconnected graphs, start from every still-unvisited vertex.

A topological ordering exists only for a DAG. Kahn’s algorithm removes indegree-zero vertices; reverse DFS finish order is another approach with cycle checking. If a prerequisite graph has a cycle, reporting a traversal sequence does not turn it into a valid dependency order.`),
    section('Dijkstra: settle the nearest tentative vertex', `Dijkstra initializes the source distance to 0 and other distances to infinity. A priority queue selects the smallest tentative distance. Relax each outgoing edge: if d[u]+w(u,v)<d[v], update d[v] and its parent. Ignore stale priority-queue entries after an improvement.

With nonnegative weights, the smallest unsettled distance cannot later be improved through a more distant unsettled vertex. That invariant justifies finalizing it. Negative weights break the argument. A binary-heap implementation takes O((V+E) log V) under standard representation assumptions.

On undirected edges A–B=2, A–C=5, B–C=1, B–D=2, C–D=3, settling A discovers B=2,C=5. Settling B improves C=3 and sets D=4. The shortest route to D is A→B→D, cost 4.`, {
      example: { problem: 'Explain why C’s initial distance 5 is not final.', steps: ['A discovers C directly with tentative distance 5.', 'B is settled first at distance 2.', 'Relax B–C with weight 1: 2+1=3<5.'], answer: 'Update C to 3 via B. Tentative values can improve until their smallest valid queue entry is settled.' },
    }),
    section('Negative edges and all-pairs paths', `Bellman-Ford repeatedly relaxes every edge. Without a reachable negative cycle, a shortest simple path uses at most V−1 edges, so V−1 rounds suffice. An additional possible improvement indicates a negative cycle reachable from the source. Vertices affected by such a cycle do not have a finite shortest-path value. Standard time is O(VE).

Floyd-Warshall computes all-pairs distances using dynamic programming. At stage k, check whether dist[i,k]+dist[k,j] improves dist[i,j]. The invariant restricts intermediate vertices to those already considered. It uses O(V³) time and O(V²) space.

Select BFS for unit weights, Dijkstra for nonnegative weights, Bellman-Ford for negative edges with cycle analysis, and Floyd-Warshall when all-pairs output and graph size suit a dense table. State the guarantee rather than merely listing complexities.`),
    section('Minimum spanning trees: Prim and Kruskal', `An MST is a minimum-total-weight spanning tree of a connected undirected weighted graph. It minimizes total connection cost, not each source-to-vertex distance. Disconnected input yields a minimum spanning forest. Negative edges are allowed for MSTs; Dijkstra’s nonnegative restriction is unrelated.

Kruskal sorts edges and adds a light edge when it connects different components, using disjoint-set union to avoid cycles. Time is O(E log E) with efficient union-find. Prim grows a tree by repeatedly selecting the cheapest edge crossing from its included vertices to an excluded one; a binary-heap version takes O(E log V) on connected graphs.

Both use the cut property: a lightest edge crossing a cut is safe for some MST consistent with prior choices. With equal weights, several MSTs may exist. The proof concerns the total tree weight, not a unique drawing.`),
    section('An MST trace and the path-versus-tree distinction', `For A–B=2, A–C=5, B–C=1, B–D=2, C–D=3, Kruskal considers B–C=1 first, then A–B=2 and B–D=2. These three edges connect all four vertices without a cycle, for total weight 5. Any further edge would create a cycle.

The same graph has a shortest path A→B→D of weight 4. “5” and “4” are not competing answers: one is the weight of a spanning tree and the other the cost of a particular route. An MST does not generally preserve shortest-path distances.

To check a spanning-tree answer, verify coverage, connectivity, V−1 edges, absence of cycles, and minimality via a justified algorithm or cut/cycle property. To check a path, verify adjacency, total weight, and its optimality argument. Match the checks to the output contract.`),
  ],
  summary: 'Traversal, shortest paths, dependency orders, and minimum spanning trees solve different graph tasks. Edge direction, weight restrictions, source requirements, and representation determine the valid algorithm and bound.',
  reviewer: {
    keyFacts: ['BFS: shortest unit-weight paths, O(V+E).', 'Dijkstra requires nonnegative edges.', 'Bellman-Ford: O(VE), handles negative edges and detects reachable negative cycles.', 'Floyd-Warshall: all pairs, O(V³).', 'MST minimizes total connection weight, not route lengths.', 'Prim uses a frontier cut; Kruskal uses sorted edges and components.'],
    questions: [
      { question: 'Why does Dijkstra reject negative edges?', answer: 'Its settle-nearest proof assumes extending a route cannot reduce its length. A later route through a negative edge may improve a supposedly final vertex.' },
      { question: 'Can an MST contain a negative-weight edge?', answer: 'Yes. MST algorithms minimize total edge weight in undirected graphs and do not use Dijkstra’s nonnegative-distance argument.' },
      { question: 'What proves a light cut edge safe?', answer: 'The cut property permits exchanging it into a suitable MST without increasing weight, while preserving connectivity.' },
      { question: 'Why might two BFS implementations choose different parents for H?', answer: 'Different neighbor or queue tie orders can discover H through different equal-length paths. Both parent trees can give valid shortest distances.' },
    ],
    exercises: [
      { problem: 'For A–B=2, A–C=5, B–C=1, B–D=2, C–D=3, compute distances from A.', solution: 'd(A)=0, d(B)=2, d(C)=3 via B, d(D)=4 via B. Distinguish these route costs from the MST total 5.' },
      { problem: 'Select an algorithm for a negative-edge single-source graph and for all-pairs distances on 30 vertices.', solution: 'Bellman-Ford handles the first and checks reachable negative cycles. Floyd-Warshall is a suitable simple all-pairs option for 30 vertices; account for O(V³) work.' },
      { problem: 'A connected undirected graph has 8 vertices. How many edges must a spanning tree have?', solution: 'Exactly 7. Fewer cannot connect all 8; more creates a cycle. Having 7 alone does not prove connectivity or minimality.' },
    ],
  },
});

const advanced = fullLesson({
  moduleId: 'Module6_Advanced_Algorithms', title: 'Advanced Algorithms: Maximum Flow and String Matching', difficulty: 'Advanced',
  description: 'Follow residual networks, augmenting paths, min-cut proofs, and the string-matching methods named in the imported module, with solved practice.',
  objectives: ['Apply capacity and conservation constraints.', 'Trace Ford-Fulkerson and justify max flow with a cut.', 'Explain reverse residual edges and Edmonds-Karp.', 'Compare naive search, Rabin-Karp, Boyer-Moore, and KMP.'],
  sections: [
    section('From graph routes to network throughput', `A shortest path asks for one cheap route. Maximum flow asks how much total flow can be sent from source S to sink T across many routes under edge capacities. Flow may split or merge at intermediate vertices; it is not restricted to one path.

Each directed edge has capacity c(u,v) and a feasible flow satisfying 0≤f(u,v)≤c(u,v). At an intermediate vertex, total entering flow equals total leaving flow. These rules prevent overloading an edge or creating flow inside the network. Flow value is net flow leaving the source, equal to net flow entering the sink.

On S→A→T with capacities 10 and 7, the bottleneck is 7. Adding capacities to obtain 17 would be incorrect: the same units pass through both edges. Networks with multiple paths require accounting for shared bottlenecks.`),
    section('Residual capacity and the ability to undo', `Residual capacity describes how a current flow can change. A forward residual edge has remaining capacity c−f. A reverse residual edge permits reducing earlier flow by up to f. The reverse edge is an algorithmic undo option, not necessarily a physical pipe in the original network.

If a path has already sent 3 units through A→B, the residual graph includes B→A capacity 3. A later augmenting path may use that reverse edge to cancel some previous A→B flow while rerouting it elsewhere. Without reverse edges, an early path choice can block a better final flow.

Keep original capacities, current flows, and residual capacities conceptually separate. A residual path may travel against the direction of an original edge because it represents modifying an existing solution, not sending new physical flow backward arbitrarily.`),
    section('Ford-Fulkerson and Edmonds-Karp', `Start with zero flow. Find a path from S to T using positive residual edges. Its bottleneck is the minimum residual capacity on that path. Increase forward flow or cancel reverse flow by that bottleneck, update residual capacities, and repeat until no residual S–T path remains.

Ford-Fulkerson is a method allowing different path choices. With nonnegative integer capacities and standard path augmentation, each successful step increases flow by at least one; the running time can depend on the final numeric flow value. For arbitrary irrational capacities, naive choices can have termination issues.

Edmonds-Karp always chooses a shortest residual path in number of edges using BFS, giving O(VE²) time independent of capacity magnitudes in the usual operation model. Dinic uses a level graph and blocking flows for stronger general bounds. Finding any path and choosing a BFS path are not identical algorithms.`, {
      code: 'flow = 0\nwhile residual_path_exists(S, T):\n    path = find_residual_path(S, T)\n    delta = min(residual_capacity(edge) for edge in path)\n    for edge in path:\n        residual[edge] -= delta\n        residual[reverse(edge)] += delta\n    flow += delta\n# Edmonds-Karp uses BFS for find_residual_path.',
    }),
    section('Solve the imported practice network', `The practice network has S→A=8, S→B=10, A→C=4, A→B=3, B→C=5, B→T=7, C→T=6. The total source capacity 18 is only an upper bound; it is not automatically the maximum flow.

Send 4 on S→A→C→T, 7 on S→B→T, and 2 on S→B→C→T. The total is 13. Check A: 4 in and 4 out. Check B: 9 in, with 7 to T and 2 to C. Check C: 6 in and 6 to T. No edge capacity is exceeded.

To prove optimality, the cut separating T from every other vertex has capacity B→T+C→T=7+6=13. No feasible flow can exceed it. A feasible flow meeting a cut bound is therefore maximum.`, {
      example: { problem: 'Show the maximum flow is 13 rather than source-capacity sum 18.', steps: ['Augment S→A→C→T by min(8,4,6)=4.', 'Augment S→B→T by 7.', 'C→T has residual 2; augment S→B→C→T by 2.', 'Both incoming sink edges are saturated: 7+6=13.'], answer: 'Maximum flow = 13, certified by the 13-capacity cut into T.' },
    }),
    section('Max-flow/min-cut and applications', `A cut partitions vertices into an S side and a T side. Its capacity is the sum of original capacities directed from the S side to the T side. Every feasible flow is bounded by every such cut; capacities of edges going the opposite way are not added to that cut capacity.

The max-flow/min-cut theorem states that maximum flow equals minimum cut capacity. At termination, let the S side be vertices reachable from S in the residual graph. If T is unreachable, this reachability set yields a cut certifying the current optimum.

Applications include bipartite assignment with unit capacities, transportation networks, project selection, and graph-cut formulations. Different path decompositions may describe the same total feasible flow. In general, simply adding guessed path capacities is unsafe when paths share edges; residual accounting enforces those shared limits.`),
    section('String matching and naive sliding windows', `String matching locates pattern P of length m inside text T of length n. Specify whether to return the first match, every match, or only membership. Overlapping matches matter: pattern ABA occurs twice in ABABA, starting at indices 0 and 2.

Naive search tries every valid starting index from 0 to n−m, comparing corresponding characters until mismatch or a full match. Worst time is O((n−m+1)m) for m≤n, commonly written O(nm). Auxiliary space can be O(1) if windows are compared by index without copying.

For pattern CONT in FLOODCONTROL, the first matching index is 5: T[5:9] is CONT. Positions before it fail, some immediately at their first character. An exact return contract also needs a policy for an empty pattern, case sensitivity, and input normalization.`),
    section('Rabin-Karp: rolling hashes and collision checks', `Rabin-Karp compares a pattern hash with each length-m text-window hash. A rolling update removes the outgoing character’s contribution, shifts the remaining polynomial hash, and adds the incoming character. This avoids recomputing an entire window hash at every shift.

Different strings can have the same hash. If exact correctness is required, a hash match must be verified by comparing the characters. Suitable hashing gives expected O(n+m) work under appropriate collision assumptions, while repeated collisions and verification can produce O(nm) worst-case behavior.

Hash equality is a filter, not a proof of string equality. A correct explanation covers hash construction, rolling update, candidate verification, and the assumptions behind the average or expected bound. Searching multiple patterns and streaming windows can make rolling hashes especially useful.`),
    section('Boyer-Moore and KMP: skip work for different reasons', `Boyer-Moore compares a pattern window from right to left. A mismatch can shift the pattern using bad-character and good-suffix information, potentially skipping many positions. Its exact worst-case bound depends on the variant and additional rules; a basic version can still have quadratic worst-case behavior. Do not infer a universal guarantee from good typical performance.

KMP preprocesses a prefix table. pi[i] is the length of the longest proper prefix of P[0..i] that is also a suffix. For AABA, pi=[0,1,0,1]. On mismatch after j matched characters, set j=pi[j−1] and reconsider the current text character, rather than restarting the text scan.

KMP takes O(n+m) worst-case time with O(m) prefix-table space. It reuses known prefix structure; Boyer-Moore uses mismatch information to shift a right-to-left comparison window. Both avoid some naive repeated comparisons, but for different reasons.`),
  ],
  summary: 'Flow algorithms enforce capacities and conservation through residual paths, including reverse undo edges. A matching cut proves maximum value. String-matching methods differ in how they avoid repeated work: window comparisons, rolling hashes, mismatch shifts, or prefix reuse.',
  reviewer: {
    keyFacts: ['A path’s bottleneck is its minimum residual capacity.', 'Reverse residual edges can cancel previous flow.', 'Edmonds-Karp = Ford-Fulkerson with BFS paths.', 'A feasible flow equal to a cut capacity is optimal.', 'CONT starts at index 5 in FLOODCONTROL.', 'Hash equality needs verification for exact matching.', 'KMP uses O(n+m) time and O(m) prefix storage.'],
    questions: [
      { question: 'Why are reverse residual edges essential?', answer: 'They let later augmentations cancel or reroute earlier choices. Without that undo mechanism, the method may get stuck below maximum flow.' },
      { question: 'Why is source outgoing capacity not necessarily the maximum?', answer: 'A downstream cut may have less capacity. In the practice graph, source capacity is 18 but sink incoming capacity is 13, and a feasible 13-flow attains that smaller bound.' },
      { question: 'What is the difference between Ford-Fulkerson and Edmonds-Karp?', answer: 'Ford-Fulkerson permits arbitrary augmenting-path choices. Edmonds-Karp chooses shortest residual paths by edge count using BFS, guaranteeing O(VE²).' },
      { question: 'How does KMP use a mismatch?', answer: 'It reuses a known matching suffix by reducing the pattern index to pi[j−1], without rewinding already-consumed text. The current text character may then be tested against the shorter prefix.' },
      { question: 'Can a rolling hash replace character verification?', answer: 'Only if probabilistic false positives are acceptable under the contract. Exact Rabin-Karp verifies hash matches because collisions are possible.' },
    ],
    exercises: [
      { problem: 'On S→A capacity 10 and A→T capacity 7, find the bottleneck and forward residual capacities after sending it.', solution: 'Bottleneck 7. Residual S→A is 3, A→T is 0, and reverse residual capacities A→S and T→A are both 7.' },
      { problem: 'Prove the practice network cannot carry 14 units.', solution: 'Every flow must enter T through B→T capacity 7 or C→T capacity 6. This cut totals 13, so 14 violates the upper bound. The demonstrated 13-flow proves maximum 13.' },
      { problem: 'Find all occurrences of ABA in ABABA and the prefix table for AABA.', solution: 'ABA starts at 0 and 2, so overlaps must be retained. AABA has pi=[0,1,0,1]; the final A matches the one-character prefix.' },
    ],
  },
});

const complexity = fullLesson({
  moduleId: 'Module 7 & 8_ Complexity Theory and Emerging Topics', title: 'Complexity Theory, Reductions, and Approximation', difficulty: 'Advanced',
  description: 'Connect polynomial reductions, SAT, NP-completeness, approximation guarantees, and randomized methods through worked examples and proof structure.',
  objectives: ['Interpret and construct polynomial reductions.', 'Distinguish P, NP, NP-hard, and NP-complete.', 'Evaluate SAT assignments and explain Cook-Levin.', 'Calculate approximation ratios with required assumptions.', 'Separate expected randomized performance from worst-case guarantees.'],
  sections: [
    section('Polynomial versus exponential and the input encoding', `Polynomial time means the work is bounded by a polynomial in encoded input length, such as n, n², or n³. Exponential functions such as 2ⁿ eventually outgrow every fixed polynomial. At n=20, n²=400, n³=8,000, and 2ⁿ=1,048,576; the difference becomes enormous as n grows.

Polynomial does not automatically mean practical: n¹⁰ can be too expensive. Exponential does not automatically mean unusable for tiny n. The distinction is a mathematical scaling classification, not a universal speed promise.

Encoding matters. A numeric value W takes about log₂W binary bits. An O(nW) integer-capacity DP can be pseudopolynomial rather than polynomial in the full bit-length. Define the representation before classifying a problem’s resource requirements.`),
    section('Reductions: transform the instance, preserve the answer', `A polynomial-time many-one reduction A≤ₚB maps each instance x of decision problem A to an instance f(x) of B in polynomial time, with x a YES-instance of A if and only if f(x) is a YES-instance of B. It transforms the instance, not merely the final answer.

If B has a polynomial solver, compose f with that solver to solve A. Reductions therefore transfer algorithms backward along the arrow. To prove B hard, begin with a known-hard A and show A≤ₚB. Reducing B to an easy problem would show something quite different.

A reduction proof must define the construction, prove both YES directions, and bound its time and output size. A transformation that preserves only YES cases can still turn a NO instance into YES and give a wrong solver.`, {
      code: 'solve_A(x):\n    y = transform_A_instance_to_B(x)  # polynomial time\n    answer = solve_B(y)\n    return answer                    # YES iff original x is YES',
    }),
    section('P, NP, hardness, and verification', `P contains decision problems solvable in deterministic polynomial time. NP contains decision problems for which a YES certificate of polynomial length can be verified in polynomial time. A solution certificate may be easy to check even when finding one seems difficult.

NP does not mean “not polynomial.” P is contained in NP: an efficiently solvable problem is also efficiently verifiable. A problem is NP-hard if every NP problem reduces to it in the appropriate polynomial reduction model. It is NP-complete when it is both NP-hard and in NP.

NP-hard problems need not belong to NP, and optimization formulations are not automatically decision problems. For TSP, “is there a tour of total length at most K?” is the decision version; “find the minimum-length tour” is an optimization task. Keep the formulation explicit when using complexity-class terminology.`),
    section('Boolean logic, SAT, and Cook-Levin', `SAT asks whether some assignment makes a Boolean formula true. AND requires both operands true; OR requires at least one; NOT reverses a truth value. In conjunctive normal form, a formula is an AND of clauses, each an OR of literals.

For (x₁ OR NOT x₂) AND (x₂ OR x₃), choose x₁=true, x₂=false, x₃=true. The first clause is true and the second is also true, so this is a satisfying assignment. One failing assignment does not prove unsatisfiability; every possible assignment would have to fail, or another proof must establish that.

Cook-Levin proves SAT is NP-complete. The proof idea encodes a polynomially bounded nondeterministic computation using Boolean constraints for valid states and transitions. A satisfying assignment corresponds to an accepting computation. This supplies a starting point for many later hardness reductions.`, {
      example: { problem: 'Evaluate the formula when x₁=false, x₂=true, x₃=false.', steps: ['Clause 1: false OR NOT true = false.', 'Clause 2: true OR false = true.', 'The conjunction is false AND true.'], answer: 'This assignment fails. The formula is still satisfiable because another assignment, such as (true,false,true), succeeds.' },
    }),
    section('A concrete reduction: independent set to vertex cover', `For an undirected graph G=(V,E), a set I is independent when no edge has both endpoints in I. A vertex cover C touches every edge. I is independent exactly when V minus I is a vertex cover: if no edge lies wholly inside I, each edge has an endpoint outside I, and the reverse argument is the same.

Therefore “is there an independent set of size at least k?” reduces to “is there a vertex cover of size at most |V|−k?” on the same graph. The construction keeps the graph and changes the threshold, so it is polynomial.

On the path A–B–C, {A,C} is an independent set of size 2 and its complement {B} is a cover of size 1. This example illustrates the construction, while the complement argument proves correctness for every graph.`),
    section('Approximation ratios and metric TSP', `An approximation algorithm returns a feasible solution with a proved bound relative to optimum. For minimization, a standard ratio is ALG/OPT; for maximization it is OPT/ALG when the objectives are positive. A ratio near 1 is better. Cost 120 versus optimum 100 gives ratio 1.2, or 20% excess.

For metric undirected TSP, edge distances obey the triangle inequality. Build an MST, double its edges to obtain a closed walk, then shortcut repeated vertices. MST weight is at most OPT, doubling costs at most 2OPT, and triangle inequality ensures shortcuts do not increase length. Thus the tour is a 2-approximation.

The metric assumption is essential. Arbitrary weighted TSP does not inherit this guarantee just because an MST can be constructed. A heuristic without a proved ratio should not be presented as an approximation algorithm with a formal constant guarantee.`),
    section('Randomized algorithms and quality guarantees', `A randomized algorithm makes internal random choices. Randomized quicksort chooses pivots randomly, giving expected O(n log n) time for each fixed input under the usual assumptions. It still has a Θ(n²) worst case over unlucky choices.

Las Vegas algorithms always return a correct result when they finish, while runtime depends on random choices. Monte Carlo algorithms have bounded resource behavior with an allowed error probability. Repetition can reduce certain errors when trials are independent and the combining rule matches the error type; there is no universal repetition rule for every randomized procedure.

Randomness, approximation, and online behavior are distinct. An algorithm may be exact and randomized, deterministic and approximate, or both. For any guarantee, state what is random, what quality or runtime is bounded, and under which assumptions it holds.`),
  ],
  summary: 'Polynomial reductions compare difficulty by fast answer-preserving transformations. SAT anchors NP-completeness. Approximation ratios need feasibility and assumptions such as metric distances; randomized expected performance must remain distinct from worst-case time and error probability.',
  reviewer: {
    keyFacts: ['A≤ₚB lets a B solver solve A.', 'To prove B hard, reduce a known-hard A to B.', 'NP means polynomial verification, not “not polynomial.”', 'NP-complete = in NP and NP-hard.', 'One false SAT assignment does not show unsatisfiability.', 'Metric TSP’s MST shortcut proof relies on triangle inequality.', 'Expected randomized time is not a worst-case guarantee.'],
    questions: [
      { question: 'What must a reduction preserve?', answer: 'The YES/NO answer in both directions, using a polynomial-time transformation whose output is a valid target instance.' },
      { question: 'Why is a verified certificate different from a solver?', answer: 'Verification checks a proposed witness. It does not necessarily find that witness among the possible candidates.' },
      { question: 'Why does independent-set complement give a cover?', answer: 'An independent set contains no entire edge, so each edge has at least one endpoint in its complement. Conversely, if the complement covers every edge, no edge lies wholly in the set.' },
      { question: 'Where is triangle inequality used in the TSP approximation?', answer: 'When skipping repeated vertices in the doubled-tree walk. A direct shortcut costs no more than the replaced path only under the metric condition.' },
      { question: 'Does random pivot selection make quicksort always n log n?', answer: 'No. It gives expected O(n log n) for a fixed input, while sufficiently unlucky pivot sequences still yield Θ(n²).' },
    ],
    exercises: [
      { problem: 'A minimization algorithm returns cost 150 while OPT=125. Compute ratio and excess.', solution: '150/125=1.2; excess is (1.2−1)×100%=20%. This instance’s ratio alone is not a proof of a guarantee across all inputs.' },
      { problem: 'For a graph with 10 vertices, translate independent-set threshold k=7 into vertex-cover threshold.', solution: 'Ask for a cover of size at most 10−7=3 on the same graph. The complement equivalence proves the YES/NO answers agree.' },
      { problem: 'You know A is NP-hard and construct B≤ₚA. Have you proved B NP-hard?', solution: 'No. That direction shows B can be solved using A. To transfer known hardness to B, construct A≤ₚB (and prove the reduction).' },
    ],
  },
});

export const ADVANCED_FULL_LESSONS: Record<string, Lesson> = Object.fromEntries(
  [analysis, recurrences, design, graphs, advanced, complexity].map(lesson => [lesson.moduleId, lesson]),
);
