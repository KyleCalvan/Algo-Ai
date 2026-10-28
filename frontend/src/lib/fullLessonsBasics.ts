import { fullLesson, section } from './fullLessonHelpers';
import type { Lesson } from './lessons';

const recursion = fullLesson({
  moduleId: 'Recursion', title: 'Recursion', difficulty: 'Intermediate',
  description: 'Build recursive solutions from a contract, trace calls and returns, prove termination, and analyze time and memory.',
  objectives: ['Identify base cases, recursive cases, and progress measures.', 'Trace factorial, Fibonacci, tree recursion, and Hanoi.', 'Analyze recursive time and stack space.', 'Explain memoization, backtracking, and tail calls.'],
  sections: [
    section('The recursive contract: solve a smaller instance', `Recursion is a method in which a function invokes itself on a smaller instance of the same problem. Begin with a contract: what does the function return for any valid input? For factorial, fact(n) returns the product of integers from 1 through n, with fact(0) = 1. Assuming fact(n − 1) follows that contract, multiplying its answer by n produces fact(n).

You do not need a different function for every size. You need a correct base case, a valid combination rule, and a guarantee that calls eventually reach the base case. State input restrictions: this factorial version accepts nonnegative integers, not arbitrary negative values or fractions.

Recursive thinking does not mean trusting a mysterious self-call. It means reasoning about a strictly smaller problem whose contract you can establish by induction.`),
    section('Base cases and a proof that calls stop', `A base case is an input answered directly without another recursive call. The recursive case transforms an unsolved input into one or more simpler inputs. A progress measure, such as n, interval length, or remaining unvisited nodes, must decrease toward a lower bound along each chain of calls.

For fact(n), n decreases by 1 until it reaches 0. A function can contain “if n == 0” and still recurse forever if it keeps calling itself with n + 1. Negative inputs miss this base case unless rejected.

Test the smallest valid input first. Empty lists, null trees, one-element intervals, and exhausted choices are common base cases. Termination explains why the calls stop; correctness additionally explains why combining smaller answers solves the original problem.`, {
      code: 'def factorial(n):\n    if n < 0:\n        raise ValueError("n must be nonnegative")\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)',
    }),
    section('The call stack: descent and unwinding', `Each unfinished call has its own stack frame containing parameters, local values, and the place execution should resume. In factorial(4), the outer call waits for factorial(3). That call waits for factorial(2), and so on. Descending creates pending work; unwinding resolves it after the base case returns.

The deepest frame is not the final answer for the original input. It supplies an answer to its caller, which performs its multiplication and returns again. Printing before a recursive call therefore produces a different order from printing after it.

A useful trace shows both directions. Listing only “4, 3, 2, 1, 0” describes inputs but omits returned values and operations performed while unwinding.`, {
      example: { problem: 'Evaluate factorial(4).', steps: ['Descent: fact(4) → fact(3) → fact(2) → fact(1) → fact(0).', 'Base: fact(0) returns 1.', 'Unwind: fact(1)=1; fact(2)=2×1=2; fact(3)=3×2=6.', 'The outer call returns 4×6=24.'], answer: '24. There are 5 calls including the n=0 base case; maximum active depth grows linearly with n.' },
    }),
    section('Time, stack space, and branching recursion', `For factorial, T(n) = T(n − 1) + Θ(1): each call does constant additional work and makes one smaller call. There are n + 1 calls, giving Θ(n) time in a fixed-cost arithmetic model. The stack also grows to Θ(n), although each frame contains only constant information. Large-integer arithmetic adds costs in a more detailed model.

Two calls do not automatically mean exponential time. Merge sort calls itself on two halves: T(n) = 2T(n/2) + Θ(n), giving Θ(n log n). Naive Fibonacci calls fib(n−1) and fib(n−2), repeatedly solving overlapping inputs; its call count is exponential.

Count total work for time and maximum simultaneously live storage for space. Adding the depths of branches executed one after another would overcount stack space.`),
    section('Fibonacci: repeated work and memoization', `Fibonacci has F(0)=0, F(1)=1, and F(n)=F(n−1)+F(n−2). Direct recursion is easy to express, but fib(5) computes fib(3) both inside fib(4) and as its second main branch. Smaller inputs repeat throughout the tree.

Memoization stores a result under its input and reuses it on subsequent calls. With a fresh cache, only distinct inputs 0 through n are evaluated. The usual arithmetic-operation count becomes Θ(n), with O(n) cache entries and recursion depth. A bottom-up loop can retain only the previous two values if the full sequence is unnecessary.

A cache key must describe everything that determines the result. Hidden mutable state or essential side effects can make caching by n alone incorrect.`, {
      code: 'def fibonacci(n, cache=None):\n    if n < 0:\n        raise ValueError("n must be nonnegative")\n    if cache is None:\n        cache = {0: 0, 1: 1}\n    if n not in cache:\n        cache[n] = fibonacci(n-1, cache) + fibonacci(n-2, cache)\n    return cache[n]',
    }),
    section('Tree recursion, divide and conquer, and Hanoi', `Recursion matches hierarchical inputs. A binary tree’s size is 0 for an empty tree; otherwise size(node)=1+size(left)+size(right). Every node contributes one, so time is Θ(n). The active stack follows one root-to-leaf path, using O(h) space for height h.

Divide and conquer solves smaller parts and combines them. Merge sort’s two sorted halves must still be merged; splitting alone does not solve the problem. The combination work belongs in the recurrence.

Tower of Hanoi moves n−1 disks aside, moves the largest disk, then moves the smaller disks onto it. M(n)=2M(n−1)+1 with M(0)=0 yields exactly 2ⁿ−1 moves. Its exponential number of moves coexists with a linear-depth stack, illustrating the difference between total work and active storage.`),
    section('Backtracking and recursion on graphs', `Backtracking builds a candidate through choices. It chooses an option, recursively explores consequences, and undoes the choice before trying another. In N-Queens, a queen sharing a column or diagonal makes a partial board infeasible, so the branch is pruned before a full board is built.

A graph differs from a tree because an edge may lead to a previously visited vertex. Recursive DFS needs a visited set or another suitable state mechanism. Without it, even a two-vertex undirected graph can bounce forever. For disconnected graphs, start from each unvisited vertex.

Recursion describes control flow, not efficiency. A backtracking algorithm may examine exponentially many candidates despite a short function body. State the choices, feasibility test, undo step, and worst-case search space.`),
    section('Tail calls, iteration, and debugging', `A call is in tail position when its result is returned directly with no pending work. “return n * factorial(n−1)” is not a tail call because multiplication remains. An accumulator can express factorial in tail-recursive form, but constant stack requires tail-call optimization by the implementation; Python does not provide it.

Prefer a loop for simple linear recursion with potentially large depth. Use an explicit stack for deep DFS. Recursive code can remain clearer for trees of manageable height.

Debug by checking smallest inputs, logging arguments at entry and results at return, verifying progress, and separating per-call state from shared state. Increasing a recursion limit does not repair infinite recursion. A complete explanation states the contract, base cases, recursive step, termination argument, trace, and resource analysis.`),
  ],
  summary: 'Recursion needs a contract, base cases, progress, and a valid combination rule. Trace both calls and returns. Analyze total work separately from active stack depth; use memoization for overlapping subproblems and iteration when deep stacks are unsuitable.',
  reviewer: {
    keyFacts: ['Base case answers directly; recursive case reduces toward it.', 'Termination and correctness require separate reasoning.', 'Factorial: Θ(n) calls and Θ(n) stack in the standard model.', 'Memoized Fibonacci evaluates O(n) distinct inputs.', 'Tree traversal: Θ(n) time, O(h) recursive stack.', 'Hanoi: 2ⁿ−1 moves; tail-call syntax alone does not guarantee constant stack.'],
    questions: [
      { question: 'Why can a function with a base case still fail to terminate?', answer: 'The argument may never reach it. Calling f(n+1) from positive n while stopping only at 0 moves in the wrong direction. Prove a bounded progress measure decreases along every chain.' },
      { question: 'Why is ordinary recursive factorial not tail-recursive?', answer: 'Each caller must multiply by n after the recursive result returns. A tail call has no operation pending on that result.' },
      { question: 'Why does memoization help Fibonacci more than factorial?', answer: 'Fibonacci repeats identical inputs across branches. Factorial already follows a chain of distinct inputs, so caching does not shorten its order of growth for one evaluation.' },
      { question: 'Why can time be exponential while stack is linear?', answer: 'Time counts all branches visited. Depth-first execution retains only one active branch and its pending callers. Hanoi performs exponentially many moves with linear depth.' },
    ],
    exercises: [
      { problem: 'Trace factorial(0), factorial(1), and factorial(5).', solution: 'fact(0)=1; fact(1)=1×1=1. For 5, unwind through returned values 1 at n=0, then 1,2,6,24,120. Each positive argument decreases by one.' },
      { problem: 'A tree has one root, a 2-node left subtree, and a 3-node right subtree. Apply the size recurrence.', solution: 'size(root)=1+2+3=6. size(null)=0. Each real node contributes exactly one, so general traversal time is Θ(n).' },
      { problem: 'How many Hanoi moves are needed for 4 disks? Does memoization remove them?', solution: '2⁴−1=15 moves. Caching a count does not perform physical moves. Computing the count and actually producing a valid move sequence are different tasks.' },
    ],
  },
});

const binarySearch = fullLesson({
  moduleId: 'Binary Search', title: 'Binary Search', difficulty: 'Beginner',
  description: 'Understand sorted input, maintain a search invariant, update boundaries safely, and extend the method to duplicate ranges and monotone predicates.',
  objectives: ['Explain why order enables halving.', 'Trace and implement a correct search.', 'Compute lower and upper bounds.', 'Analyze complexity and boundary cases.'],
  sections: [
    section('Sorted order turns comparison into information', `Binary search repeatedly discards part of an ordered search space. In an ascending array, if the middle value is less than the target, every position at or before it is also too small. A single comparison therefore eliminates many candidates. Without sorted order, that conclusion is invalid.

An unsorted list does not become suitable because the function is named binary_search. Sort first, maintain an ordered structure, or choose an unsorted-input method. Sorting costs time and may change original indices; for just one query a linear scan may be cheaper.

The usual logarithmic time also assumes constant-time indexed access. Repeatedly finding a linked list’s midpoint may require traversal, so the array analysis does not transfer automatically. State the input and access assumptions with the algorithm.`),
    section('Inclusive boundaries and the loop invariant', `For an inclusive interval [lo, hi], every remaining candidate lies between lo and hi. Continue while lo≤hi. Initially lo=0 and hi=n−1; an empty array has hi=−1 and skips the loop.

Compute mid=lo+floor((hi−lo)/2). Return mid on equality. If a[mid] is smaller than the target, set lo=mid+1; otherwise set hi=mid−1. Moving beyond mid is essential because that position has already been rejected. Updating lo=mid can stall on a small interval.

The invariant proves that no discarded position can hold the target. Strictly shrinking the candidate interval proves termination. Together they justify returning either a matching index or not-found; a trace alone does not establish correctness for every input.`, {
      code: 'def binary_search(a, target):\n    lo, hi = 0, len(a)-1\n    while lo <= hi:\n        mid = lo + (hi-lo)//2\n        if a[mid] == target:\n            return mid\n        if a[mid] < target:\n            lo = mid+1\n        else:\n            hi = mid-1\n    return -1',
    }),
    section('Successful and unsuccessful traces', `Record lo, hi, mid, the middle value, and the reason for every update. For [1,3,5,7,9,11,13], searching for 13 inspects indices 3,5,6. Each rejected midpoint moves the lower boundary past itself.

Searching for 8 inspects 7 at index 3 and sets lo=4, then 11 at index 5 and sets hi=4, then 9 at index 4 and sets hi=3. Now lo>hi, so the interval is empty and the function returns −1. It must not read a[lo] as if a match existed.

An insertion position may exist even when the target is absent. Membership search and insertion-point search therefore have different return contracts, and callers must not silently treat one as the other.`, {
      example: { problem: 'Find 13 in [1,3,5,7,9,11,13].', steps: ['lo=0, hi=6, mid=3: 7<13 → lo=4.', 'lo=4, hi=6, mid=5: 11<13 → lo=6.', 'lo=6, hi=6, mid=6: 13 equals the target.'], answer: 'Index 6, after 3 midpoint comparisons.' },
    }),
    section('Time and space from repeated halving', `After k unsuccessful comparisons, the number of remaining candidates is about n/2ᵏ. Setting that size near 1 gives k≈log₂n. The worst-case bound is Θ(log n) on nonempty arrays; matching the first midpoint takes Θ(1).

The iterative version stores only boundaries and a midpoint, so auxiliary storage is O(1). Index-based recursion uses O(log n) stack frames. Copying array slices can add linear copying work across a search and changes the usual bound; passing indices avoids that cost.

Doubling a large n adds about one comparison. The specific result “3 comparisons” describes one instance. The halving argument explains the general growth. If comparisons themselves are expensive, such as comparing long strings, include that cost in a more detailed analysis.`),
    section('Duplicates: lower and upper bounds', `An exact-match search may return any duplicate. Lower bound finds the first position whose value is at least the target; upper bound finds the first position strictly greater. Both can be implemented with a half-open interval [lo,hi), initially [0,n).

For lower bound, a[mid]<target means lo=mid+1; otherwise hi=mid. Stop when lo==hi. Unlike inclusive exact search, mid remains a candidate when its value might be the first qualifying one. Mixing these two templates is a frequent source of bugs.

For [1,3,7,7,7,9], target 7 has lower bound 2 and upper bound 5, so it occurs 3 times. An absent target has equal boundaries. A boundary may equal n, so membership additionally requires index<n and a[index]==target.`, {
      code: 'def lower_bound(a, target):\n    lo, hi = 0, len(a)\n    while lo < hi:\n        mid = lo + (hi-lo)//2\n        if a[mid] < target:\n            lo = mid+1\n        else:\n            hi = mid\n    return lo',
    }),
    section('Binary search on answers and a test checklist', `Sometimes the answer domain is ordered even without an array. If feasible(k) is false for all small k and true for all sufficiently large k, binary search can locate the first true answer. Increasing capacity without making a feasible schedule infeasible is one example.

For R possible integer answers and predicate cost C, the search costs O(C log R). Prove monotonicity: if feasibility can alternate arbitrarily, rejecting half the domain is unjustified. Rotated arrays and other variants also need their own invariants; an unchanged sorted-array rule is insufficient.

Test empty and one-item inputs, duplicates, a target below every value, one above every value, and an absent target between values. In fixed-width integer languages, use lo+(hi−lo)//2 to avoid overflow from adding two large indices. State boundary conventions before writing an exam solution.`),
  ],
  summary: 'Order or monotonicity permits halving. Keep consistent boundaries, move past rejected candidates, and distinguish membership from insertion bounds. Standard array search takes O(log n) time and O(1) iterative auxiliary storage.',
  reviewer: {
    keyFacts: ['Standard binary search requires sorted input and indexed access.', 'Inclusive search: lo≤hi, initial hi=n−1.', 'Half-open lower bound: lo<hi, initial hi=n.', 'Safe midpoint: lo+(hi−lo)//2.', 'Duplicate count = upper bound − lower bound.', 'Answer search requires a monotone predicate.'],
    questions: [
      { question: 'Why is lo=mid wrong after rejecting a[mid]?', answer: 'It can retain an already-rejected index and fail to shrink a one- or two-item range. In inclusive exact search, move to mid+1 when the middle value is too small.' },
      { question: 'Does lower_bound prove membership?', answer: 'No. It returns an insertion position, possibly n. Check index<n and a[index]==target before claiming a match.' },
      { question: 'When is sorting first worthwhile?', answer: 'When many ordered operations justify it. Sorting once costs O(n log n); q later searches cost O(q log n). A single unsorted scan costs only O(n).' },
      { question: 'Why does slicing alter recursive complexity?', answer: 'Copying slices adds work proportional to their lengths. The O(log n) comparison bound assumes interval changes do not copy elements.' },
    ],
    exercises: [
      { problem: 'Find 4 in [2,4,6,8,10] with inclusive boundaries.', solution: 'mid=2 gives 6, so hi=1. mid=0 gives 2, so lo=1. mid=1 gives 4. Return 1 after 3 comparisons.' },
      { problem: 'Find lower/upper bounds for 7 and 8 in [1,3,7,7,9].', solution: 'For 7: lower=2, upper=4, count=2. For 8: lower=upper=4, count=0; the insertion position is before 9.' },
      { problem: 'feasible(k) first becomes true at 17 in 1..32. Why may binary search be used?', solution: 'If every k<17 is false and every k≥17 is true, the predicate is monotone. Each result rules out one side, locating 17 in O(log 32) calls.' },
    ],
  },
});

const traversal = fullLesson({
  moduleId: 'Graph Traversal (BFS/DFS)', title: 'Graph Traversal: BFS and DFS', difficulty: 'Intermediate',
  description: 'Follow queue and stack state, reconstruct paths, handle disconnected graphs, and extend traversal to cycles and dependency order.',
  objectives: ['Represent graphs with lists or matrices.', 'Trace BFS and DFS.', 'Reconstruct shortest unweighted paths.', 'Detect components and cycles; produce a topological order.'],
  sections: [
    section('Graphs, representations, and reachability', `A graph G=(V,E) has vertices and edges. An undirected edge connects both directions; u→v in a directed graph does not imply v→u. Traversal explores vertices reachable from a starting vertex according to these directions.

An adjacency list stores neighbors and uses O(V+E) space. An adjacency matrix uses O(V²) space with constant-time edge lookup. Scanning all lists examines O(V+E) entries; scanning every matrix row can take O(V²) work.

Fix neighbor order when comparing traces. BFS and DFS can produce several valid visitation orders for the same graph. Alphabetical order makes the examples unambiguous. Another neighbor order changes the trace without necessarily making the algorithm incorrect. Reachability from one source is different from covering an entire disconnected graph.`),
    section('BFS: a queue builds distance layers', `Breadth-first search uses a FIFO queue. Mark the source when enqueuing it. Repeatedly remove the front vertex, inspect its neighbors, and enqueue undiscovered neighbors, marking each immediately. The queue processes distance layers in order.

With unit-cost edges, first discovery gives a shortest path by edge count. Record distance[v]=distance[u]+1 and parent[v]=u when u discovers v. To reconstruct the route, follow parent pointers backward from the target and reverse the result.

Marking on enqueue ensures one queue entry per vertex. Marking only on dequeue can admit duplicate pending copies. With extra checks such an implementation can still be correct, but it loses the simple one-enqueue invariant. Use a real queue; removing the front of a plain array may add shifting cost.`, {
      code: 'from collections import deque\n\ndef bfs(graph, source):\n    distance = {source: 0}\n    parent = {source: None}\n    queue = deque([source])\n    while queue:\n        u = queue.popleft()\n        for v in graph[u]:\n            if v not in distance:\n                distance[v] = distance[u] + 1\n                parent[v] = u\n                queue.append(v)\n    return distance, parent',
    }),
    section('A complete BFS queue trace', `Use undirected edges A–B, A–C, B–D, B–E, C–F and alphabetical neighbors. Initially the queue is [A]. Processing A discovers B and C: [B,C]. Processing B discovers D and E: [C,D,E]. Processing C discovers F: [D,E,F]. The remaining vertices add no undiscovered neighbors.

The first-visit order is A,B,C,D,E,F. Distances are 0 for A, 1 for B and C, and 2 for D,E,F. Parent links are B←A, C←A, D←B, E←B, F←C.

To reconstruct the path to E, follow E→B→A backward, then reverse it to A→B→E. Its two edges agree with distance[E]. Parent links form a traversal tree, even if the original graph includes extra edges.`, {
      example: { problem: 'What is the queue immediately after processing B?', steps: ['Before B, queue=[B,C].', 'Pop B, leaving [C].', 'Append D and E, marking each on discovery.'], answer: '[C,D,E]. C was already waiting, so it stays ahead of newly discovered nodes.' },
    }),
    section('DFS: explore deeply and backtrack', `Depth-first search fully explores an unvisited neighbor before trying the next. Recursive DFS obtains this order from the call stack. On the example graph, alphabetical DFS visits A,B,D,E,C,F. After D finishes, it returns to B to explore E, then eventually returns to A to start C.

Iterative DFS uses an explicit stack. Pushing neighbors in reverse alphabetical order makes the alphabetically first neighbor pop first. Marking on pop and skipping already-visited entries is a simple implementation, though its stack can contain duplicates. Distinguish stack contents from first-visit order.

DFS supports reachability, component labels, structural analysis, and backtracking. It does not generally return shortest paths. Its recursion depth can reach V on a chain; an explicit stack avoids relying on a language’s recursion limit.`),
    section('Time and memory depend on representation', `With adjacency lists, BFS and DFS process each vertex and neighbor entry a constant number of times, giving O(V+E) for a full traversal. A single-source run can instead be analyzed over its reachable subgraph. With adjacency matrices, scanning neighbors gives O(V²).

Visited, distance, and parent structures each use at most O(V) space. A BFS queue can hold O(V) vertices on a wide frontier. DFS can also have O(V) active frames on a chain. Recursive tree DFS uses O(h) call-stack space for height h, though a separate visited set adds storage if maintained.

“DFS always uses less memory” is therefore not a theorem. State the graph shape, frontier size, stack depth, and extra structures. Include input storage separately when the question asks for total rather than auxiliary space.`),
    section('Components and cycle detection', `To cover a disconnected undirected graph, loop through every vertex and start BFS or DFS whenever it is unvisited. Each new start identifies a component. Directed reachability is different; strongly connected components require an algorithm such as Kosaraju or Tarjan.

In a simple undirected graph, encountering an already-visited neighbor other than the DFS parent proves a cycle. The parent edge is merely the edge used to enter the vertex. Parallel-edge multigraphs need edge-aware treatment.

For a directed graph, use unvisited, active, and finished states. An edge to an active vertex is a back edge and proves a cycle. An edge to a finished vertex does not by itself prove one. A plain visited flag loses this distinction and can produce incorrect cycle reports.`),
    section('Topological order and when to use each traversal', `A topological order places u before v for every directed edge u→v. It exists exactly for a directed acyclic graph. Kahn’s algorithm enqueues all indegree-zero vertices, removes one, decrements its neighbors’ indegrees, and enqueues any that become zero. Outputting fewer than V vertices indicates a cycle.

DFS provides another method: reverse finish order while using active states to reject cycles. Multiple orders may be valid when several vertices have no dependency between them.

Use BFS for minimum-edge routes, grid distance, and layered discovery. Use DFS for structural exploration, backtracking, and dependency analysis. Build systems and course scheduling need topological order, not an arbitrary BFS order. Choose by the required property, then explain why the traversal guarantees it.`),
  ],
  summary: 'BFS discovers distance layers with a queue; DFS follows a branch and backtracks. Adjacency-list traversal takes O(V+E), with O(V) worst-case auxiliary space. Parent pointers reconstruct paths; additional states support cycle detection and topological order.',
  reviewer: {
    keyFacts: ['BFS uses FIFO; DFS uses a stack or recursion.', 'Mark on BFS enqueue to prevent duplicate queue entries.', 'BFS shortest-path guarantee assumes unit-cost edges.', 'One source does not cover every disconnected component.', 'Directed cycle: edge to an active vertex.', 'Topological order exists exactly for a DAG.'],
    questions: [
      { question: 'Why does BFS find a minimum-edge path?', answer: 'FIFO processes every smaller distance layer before a larger one. First discovery from layer d assigns d+1, and no undiscovered shorter route can skip the earlier layers.' },
      { question: 'Does an edge to a visited vertex always mean a cycle?', answer: 'No. Exclude the parent edge in a simple undirected graph. In directed DFS, an edge to an active vertex proves a cycle; reaching a finished vertex need not.' },
      { question: 'How does Kahn’s algorithm detect a cycle?', answer: 'If the queue empties after fewer than V vertices have been output, the remaining dependencies contain a cycle.' },
      { question: 'What changes with an adjacency matrix?', answer: 'Every vertex’s neighbor scan checks V entries, making a full traversal O(V²) instead of the list-based O(V+E).' },
    ],
    exercises: [
      { problem: 'Trace alphabetical DFS with edges A–B, A–C, B–D, B–E, C–F.', solution: 'A→B→D, return to B→E, return to A→C→F. First-visit order is A,B,D,E,C,F. Returning through parents adds no new first visits.' },
      { problem: 'Edges A–B and C–D, plus isolated E: how many components?', solution: 'Three: {A,B}, {C,D}, {E}. Launch a new traversal from each still-unvisited vertex.' },
      { problem: 'Order A→C, B→C, C→D topologically; then add D→A.', solution: 'A,B,C,D or B,A,C,D works initially. D→A creates A→C→D→A, so no topological order remains.' },
    ],
  },
});

const sorting = fullLesson({
  moduleId: 'Sorting Algorithms', title: 'Sorting Algorithms', difficulty: 'Beginner',
  description: 'Trace elementary, divide-and-conquer, heap, and non-comparison sorting while comparing stability, memory, and time guarantees.',
  objectives: ['Trace bubble, selection, insertion, merge, and quicksort.', 'Compare average and worst cases.', 'Explain stability and in-place sorting.', 'Select a method from data constraints.'],
  sections: [
    section('The contract, stability, and storage', `A correct sort produces nondecreasing keys while preserving the original multiset of elements. It cannot lose duplicates or invent values. When sorting records by one field, the rest of each record must travel with its key.

A stable sort preserves the relative order of equal-key records. If two students have the same score, a stable score sort retains their previous order. Stability depends on the implementation: changing how equal keys are handled can change it.

In-place sorting uses little auxiliary storage beyond the input, with recursion sometimes reported separately. Compare extra arrays, stack depth, record movement, and key-computation costs. The best method depends on the required ordering and available resources, not just an algorithm name.`),
    section('Bubble, selection, and insertion', `Bubble sort compares adjacent items and swaps out-of-order pairs. A complete left-to-right pass moves a maximum remaining item to the end. A swap flag permits early termination after a pass with no swaps: Θ(n) on sorted input, but Θ(n²) worst-case.

Selection sort scans for the minimum remaining value and exchanges it into the next output position. It makes Θ(n²) comparisons even on sorted input, with only O(n) swaps. Its usual swapping form is unstable.

Insertion sort maintains a sorted prefix and shifts larger keys to insert each next item. For [5,2,4,1,3], the prefixes become [2,5], [2,4,5], [1,2,4,5], and [1,2,3,4,5]. It has Θ(n²) worst time but is efficient on small or nearly sorted inputs. Shifting only strictly larger values preserves stability.`, {
      code: 'def insertion_sort(a):\n    for i in range(1, len(a)):\n        value = a[i]\n        j = i-1\n        while j >= 0 and a[j] > value:\n            a[j+1] = a[j]\n            j -= 1\n        a[j+1] = value\n    return a',
    }),
    section('Merge sort: sort the halves, then combine', `Merge sort splits the input, recursively sorts both parts, and merges them. A pointer into each sorted run identifies the next candidates. Take the smaller current item and advance that pointer; when one run ends, append the other run’s remainder.

The invariant is that the output prefix is sorted and contains the smallest items consumed so far. For stability, take from the left run first when keys are equal. Sorting the halves alone is insufficient; they must still be merged.

T(n)=2T(n/2)+Θ(n) gives Θ(n log n): logarithmically many levels, each with linear total merge work. Standard array merge sort uses Θ(n) auxiliary storage and O(log n) recursive depth. External sorting uses the same merging idea on sorted runs held on storage.`, {
      example: { problem: 'Merge [2,5,8] and [1,3,7].', steps: ['2 versus 1 → take 1.', '2 versus 3 → take 2; then 5 versus 3 → take 3.', '5 versus 7 → take 5; then 8 versus 7 → take 7.', 'Right side exhausted → append 8.'], answer: '[1,2,3,5,7,8]. Pointers move only forward, giving Θ(n) merge work for n total items.' },
    }),
    section('Quicksort: partition before recursion', `Quicksort chooses a pivot and partitions values into appropriate smaller and larger sides. The partition convention determines how equal keys are treated. It then sorts the remaining subarrays; no separate merge is required.

Balanced partitions give Θ(n log n). Repeated sizes 0 and n−1 produce T(n)=T(n−1)+Θ(n)=Θ(n²). First-pivot quicksort on sorted distinct values is a familiar example. A random pivot gives expected O(n log n) for fixed input, while the worst case remains quadratic.

In-place partitioning uses little extra array storage, but recursion uses O(log n) depth for balanced partitions and potentially O(n) for badly unbalanced ones. Three-way partitioning handles duplicates effectively. Ordinary quicksort is unstable, so it does not replace a stable sort when preserving equal-key order is required.`),
    section('Heap sort, counting sort, and radix sort', `Heap sort builds a max-heap, swaps the maximum root to the final unsorted position, then restores heap order. Bottom-up heap construction takes O(n); repeated removals give O(n log n) overall. The usual implementation is in-place and unstable.

General comparison sorts have an Ω(n log n) worst-case comparison lower bound for unrestricted distinct keys. Counting sort does not contradict it: counting uses key values in a bounded range of size k, giving O(n+k) time. A typical stable version uses O(n+k) space. When k is huge, those counts are too expensive.

Radix sort processes digit positions using a stable per-digit method. Its cost depends on digit count and alphabet size. Calling every non-comparison sort “linear” without stating these parameters hides the assumptions that make it efficient.`),
    section('Selecting and checking a sort', `Use insertion sort for small or nearly sorted arrays; stable merge sort for predictable comparison time when extra memory is allowed; heap sort for worst-case O(n log n) with little auxiliary space; and carefully implemented quicksort when its average performance and memory access patterns suit the task. Library sorts often combine techniques.

A benchmark should compare the same input sizes, key types, and conditions. Count comparisons separately from allocations, swaps, or expensive key calculations. Constants matter for small inputs even when asymptotic bounds differ.

Verify both nondecreasing output and preservation of the original multiset. Test empty, single-item, duplicate-heavy, sorted, reverse-sorted, and negative-value arrays. To test stability, attach original positions and ensure equal-key records retain their order. A sorted-looking array alone does not prove that no data was lost.`),
  ],
  summary: 'Sorting methods differ in invariants, equal-key behavior, and resource use. Compare time cases, extra storage, and stability; state key-range or digit assumptions for non-comparison methods.',
  reviewer: {
    keyFacts: ['Optimized bubble and insertion: linear best case.', 'Selection: Θ(n²) comparisons even on sorted input.', 'Merge: Θ(n log n), stable when ties favor the left run.', 'Quicksort: expected O(n log n), worst Θ(n²).', 'Heap sort: worst O(n log n), ordinarily unstable.', 'Counting: O(n+k), where k is the key range.'],
    questions: [
      { question: 'Why is merge sort n log n?', answer: 'Θ(n) merge work at each of Θ(log n) levels sums to Θ(n log n).' },
      { question: 'What makes quicksort quadratic?', answer: 'Repeated highly unbalanced partitions make the partition costs n+(n−1)+…+1=Θ(n²).' },
      { question: 'Why does insertion sort shift only strictly larger keys?', answer: 'An equal key remains before the new record, preserving its earlier position. Shifting equal keys as well can break stability.' },
      { question: 'Does counting sort break the comparison lower bound?', answer: 'No. It uses bounded key values rather than only pairwise comparisons, and its cost includes the range k.' },
    ],
    exercises: [
      { problem: 'Show one bubble pass on [5,2,4,1,3].', solution: '[2,5,4,1,3] → [2,4,5,1,3] → [2,4,1,5,3] → [2,4,1,3,5]. The maximum reaches its final position.' },
      { problem: 'Choose a stable sort with worst-case O(n log n) when extra array storage is permitted.', solution: 'Stable merge sort, with left-run tie preference. Ordinary heap sort and quicksort fail the stability requirement.' },
      { problem: 'For 1,000 keys in range 0..9, what are counting-sort parameters?', solution: 'n=1,000 and k=10, so the modeled work is O(1,010), making the small range attractive. A trillion-value range would change the trade-off.' },
    ],
  },
});

const trees = fullLesson({
  moduleId: 'Binary Trees', title: 'Binary Trees and Binary Search Trees', difficulty: 'Intermediate',
  description: 'Study structure, traversal, search, updates, deletion, balance, and height-dependent performance using a complete example tree.',
  objectives: ['Distinguish a binary tree from a BST.', 'Trace four traversal orders.', 'Perform search, insertion, and deletion.', 'Analyze height and validate ancestor bounds.'],
  sections: [
    section('Structure and vocabulary', `A tree is a connected acyclic structure. In a rooted tree, each non-root node has one parent; nodes below it are descendants. A binary tree has at most two ordered child positions, left and right. A leaf has no children; a subtree consists of a node and its descendants.

Depth counts edges from the root. Height counts edges on a longest downward path; with this convention a leaf has height 0 and the empty tree commonly has height −1. Some texts count nodes instead, so state the convention.

A full binary tree gives every node zero or two children. A complete tree fills levels from the left, except that the last may be incomplete. A perfect tree fills every level. None of these structural terms automatically implies the search-tree ordering property.`),
    section('The BST property applies to entire subtrees', `For distinct keys, every key in a node’s left subtree must be smaller and every key in the right subtree larger. This is not merely a comparison with immediate children. A descendant 9 anywhere in the left subtree of root 8 violates the rule even if it fits its immediate parent.

Search compares the target and follows only the possible side. A smaller target goes left; a larger target goes right. Reaching null means absent. Insertion follows the same path and attaches a new node at the appropriate null position.

Duplicates need a clear policy: reject them, store a count, or define a consistent ordering. Without one, the invariant and deletion contract are ambiguous. The search rule is justified by the invariant, rather than by the drawing’s visual appearance.`, {
      code: 'def search(root, key):\n    node = root\n    while node is not None:\n        if key == node.key:\n            return node\n        node = node.left if key < node.key else node.right\n    return None',
    }),
    section('All four traversals of an example tree', `Insert 8,4,12,2,6,10,14. The root is 8; its children are 4 and 12; the last level is 2,6,10,14. Searching for 6 follows 8→4→6 because 6 is below 8 but above 4.

Preorder is root-left-right. Inorder is left-root-right. Postorder is left-right-root. Level order uses BFS and visits one depth at a time. Preorder can support copying structure; postorder processes children before their parent, useful when freeing nodes or evaluating expression trees.

Inorder yields sorted keys only for a valid BST. Every binary tree has an inorder traversal, but arbitrary trees need not produce sorted output. Each complete traversal visits n nodes and therefore takes Θ(n) time regardless of whether the tree is balanced.`, {
      example: { problem: 'Traverse the seven-node BST rooted at 8.', steps: ['Preorder: 8,4,2,6,12,10,14.', 'Inorder: 2,4,6,8,10,12,14.', 'Postorder: 2,6,4,10,14,12,8.', 'Level order: 8,4,12,2,6,10,14.'], answer: 'Every traversal visits 7 nodes once. The tree has height 2 under the edge-count convention.' },
    }),
    section('Deletion: three structural cases', `Deleting a leaf removes its parent link. Deleting a one-child node replaces its incoming link with its child, preserving the surrounding subtree ordering. Deleting a two-child node needs a replacement key between all remaining left and right keys.

The inorder successor, the smallest key in the right subtree, is one option. Copy or transplant it and remove its old node; the successor has no left child, so that removal is an easier case. The largest key in the left subtree, the predecessor, is another valid choice.

Deleting root 8 from the example using the successor chooses 10. Replacing the root key with 10 and deleting the old 10 leaf preserves the ordering. Update the root reference when necessary: root deletion cannot always be handled only by changing an ordinary parent’s child link.`),
    section('Height, balance, and rotations', `Search, insertion, and deletion follow O(h) nodes for tree height h. A balanced tree has h=O(log n), making these operations logarithmic. Inserting sorted distinct keys into an ordinary BST may create a chain with height n−1, giving O(n) lookup and update time.

AVL and red-black trees restore balance using invariants and rotations. AVL limits child-height differences; red-black trees maintain color constraints. Both guarantee logarithmic height, though their update constants and trade-offs differ. A rotation changes parent-child links while preserving the inorder sequence of keys.

Recursive DFS uses O(h) active stack space. Level-order traversal may hold O(n) nodes on a wide frontier. Balanced search does not make enumerating all keys logarithmic: reporting n values still requires Θ(n) work.`),
    section('Validation and choosing an ordered structure', `A correct BST validator passes an allowed interval down the recursion. The left subtree receives the current key as an upper bound; the right receives it as a lower bound. Descendants must satisfy all ancestor restrictions, so direct child comparisons alone are insufficient.

For distinct keys, strictly increasing inorder output is another validation criterion. Adapt the rule for duplicates. Test empty and one-node trees, skewed chains, deleting the root, and a deep descendant that violates an ancestor’s bound.

BSTs support minimum, maximum, predecessor, successor, and range queries. A heap exposes an extreme key but does not satisfy the BST invariant. A sorted array supports binary search but may need linear shifting for insertion. Choose from the entire operation mix and required guarantees.`),
  ],
  summary: 'A binary tree limits children; a BST additionally orders whole subtrees. Traversal rules, deletion cases, and ancestor bounds explain correctness. Operations take O(h), making height control central to logarithmic performance.',
  reviewer: {
    keyFacts: ['Binary tree ≠ BST.', 'BST bounds include all descendants.', 'Inorder of a BST is sorted.', 'Two-child deletion can use successor or predecessor.', 'Balanced operations O(log n); skewed O(n).', 'Any full traversal takes Θ(n).'],
    questions: [
      { question: 'Why do local child tests miss BST violations?', answer: 'A descendant must fit every ancestor’s bounds. A 9 in the left subtree of root 8 violates the root even if it is properly positioned relative to its immediate parent.' },
      { question: 'Why is the inorder successor a valid replacement?', answer: 'It is the smallest key in the right subtree, so it exceeds all left keys and fits before the remaining right keys. Its old node has no left child, simplifying removal.' },
      { question: 'How does a heap differ from a BST?', answer: 'A heap orders parents against children to expose a minimum or maximum. A BST partitions whole subtrees by key, supporting ordered lookup. A heap’s inorder traversal need not be sorted.' },
      { question: 'Why can sorted insertion be harmful?', answer: 'In an unbalanced BST it repeatedly extends the same side, making a chain of height Θ(n). An operation following that height then costs Θ(n).' },
    ],
    exercises: [
      { problem: 'Insert 5,3,7,4. Give inorder and preorder.', solution: '5 is root; 3 is left; 7 right; 4 is 3’s right child. Inorder: 3,4,5,7. Preorder: 5,3,4,7.' },
      { problem: 'Delete 5 from that BST using its successor.', solution: 'The successor is 7. Replace root 5 with 7 and remove the old 7 leaf. The remaining inorder sequence is 3,4,7.' },
      { problem: 'A chain contains 10 nodes. Give height and worst lookup cost.', solution: 'Height is 9 edges. The deepest or an absent key can require all 10 comparisons; the general worst bound is Θ(n).' },
    ],
  },
});

const bigO = fullLesson({
  moduleId: 'Big-O Notation', title: 'Big-O Notation and Growth Rates', difficulty: 'Beginner',
  description: 'Derive growth bounds, use five asymptotic notations correctly, and distinguish case analysis, amortization, and practical performance.',
  objectives: ['Apply O, Ω, Θ, o, and ω.', 'Count sequential, nested, and logarithmic work.', 'Separate input cases from asymptotic bounds.', 'Report auxiliary memory and independent input sizes.'],
  sections: [
    section('Define input size and the operation model', `Complexity describes how a resource grows with size. An array uses length n; a graph uses V and E; a numeric problem may use the number of bits representing its input. A loop taking M steps can be exponential in bit-length log₂M, so confusing value with representation size changes the conclusion.

Choose the counted operation. Comparing fixed-size numbers is constant time in a standard word model. Comparing long strings or multiplying arbitrary-size integers may require more work. Complexity abstracts operations rather than predicting seconds on one computer.

A scan can have count T(n)=an+b, with implementation-dependent constants. The growth class ignores fixed coefficients while explaining that doubling a large n approximately doubles the linear part of the work. State assumptions before simplifying.`),
    section('Upper, lower, tight, and strict bounds', `For eventually nonnegative functions, f(n)=O(g(n)) means f(n)≤c·g(n) for some positive c and every n beyond some n₀. Ω gives a matching kind of lower bound. Θ means both upper and lower constant-factor bounds hold.

For n≥1, 3n²≤3n²+5n+7≤15n², proving Θ(n²). The function is also O(n³), but that loose upper bound is less informative. Big-O alone does not assert tightness.

Little-o means strict slower growth: f=o(g) when f/g tends to 0 for positive comparison functions where this limit test applies. Little-omega means f/g tends to infinity. Their formal definitions quantify over every positive constant c. A strict inequality at a few inputs does not establish strict asymptotic separation; for example 2n<n² eventually, but 2n is not o(n).`),
    section('The growth hierarchy and what a graph means', `Common classes include constant, logarithmic, linear, n log n, polynomial, exponential, and factorial. Indexing an array is constant; binary search logarithmic; scanning linear; merge sort n log n; all-pairs comparison quadratic. Subset enumeration has 2ⁿ candidates; permutation enumeration can have n!.

At n=16: log₂n=4, n=16, n log₂n=64, n²=256, and 2ⁿ=65,536. These are exact growth-function values, not universal operation counts for every algorithm in those classes. A large constant may make a better-growth algorithm slower on small input.

Changing a logarithm’s base multiplies by a constant, preserving its asymptotic class. Exponential bases behave differently: 2ⁿ and 3ⁿ do not differ by a constant factor. A log-scale chart helps display disparate values but must label its scale.`),
    section('Count loops before simplifying', `Sequential phases add. A scan followed by a scan costs n+n=2n, hence Θ(n). Independent nested loops multiply: n repetitions of n operations give n². A triangular loop j<i executes 0+1+…+(n−1)=n(n−1)/2 times, also Θ(n²).

A loop repeatedly doubling i from 1 toward n runs Θ(log n) times. If every iteration performs a fresh n-element scan, total work is Θ(n log n). If its inner loop instead runs i times at i=1,2,4,…, the geometric sum is below 2n, giving Θ(n).

The number of written loops is therefore not enough. Check bounds, updates, and dependencies. Derive the sum representing executed work, then simplify it; do not attach a complexity class just from indentation.`, {
      example: { problem: 'Count the work in “for i in range(n): for j in range(i): work()”.', steps: ['At i=0 there are 0 executions; at i=1 there is 1.', 'Total executions are 0+1+…+(n−1).', 'The sum is n(n−1)/2.'], answer: 'Θ(n²) if work() is constant time. With n=5, the body runs exactly 10 times.' },
    }),
    section('Best, average, worst, and amortized analysis', `Best case minimizes over size-n inputs; worst case maximizes. Average case is an expectation over a specified distribution. Linear search is constant in the best case and linear in the worst; a uniformly distributed successful target takes (n+1)/2 expected comparisons.

O, Ω, and Θ bound whichever function you analyze. Big-O is not inherently worst-case, and Ω is not inherently best-case. “Worst-case Θ(n)” correctly combines a case with a tight bound.

Amortized analysis bounds an operation sequence without assuming random inputs. A dynamic array append occasionally copies Θ(n) elements on resizing, but geometric capacity growth yields O(1) amortized cost over many appends. That does not make every append constant time. Keep one-operation worst-case, expected cost, and sequence-average cost distinct.`),
    section('Space, multiple parameters, and reporting', `Auxiliary space is storage added beyond the input unless another convention is specified. One accumulator uses O(1) words; an input copy uses O(n). Recursion counts too: n constant-size frames use O(n) stack. Large numeric values may use additional bits even when the number of variables is fixed.

Preserve independent parameters: comparing every member of an n-list with every member of an m-list costs O(nm), not automatically O(n²). Graph traversal uses O(V+E). Input-output size can impose unavoidable time and storage costs.

A complete report identifies size and assumptions, counted work or recurrence, the chosen case, time bound, and space bound. Profiling then addresses constants, cache locality, and realistic workloads. Asymptotic analysis and measurement complement each other; neither replaces specifying the problem correctly.`),
  ],
  summary: 'Count actual work, simplify its growth, and distinguish the bound from the case being analyzed. Include auxiliary storage, independent parameters, and assumptions. Strict asymptotic notations concern growth separation rather than isolated inequalities.',
  reviewer: {
    keyFacts: ['O upper; Ω lower; Θ both.', 'o and ω require strict growth separation.', 'Sequential work adds; independent nested work multiplies.', 'Geometric sums can make nested-looking work linear.', 'Average requires a distribution; amortized bounds a sequence.', 'Input value and bit-length are different size measures.'],
    questions: [
      { question: 'Is n=O(n²) true? Is it tight?', answer: 'True because n≤n² for n≥1, but loose. The tight class is Θ(n). A valid upper bound need not be the most informative one.' },
      { question: 'Is 3n=o(n)?', answer: 'No: the ratio is 3 rather than approaching 0. It is Θ(n). By contrast, n=o(n²) because 1/n→0.' },
      { question: 'Why does a costly resize not refute amortized constant append?', answer: 'Across geometric resizes, copied elements form a geometric sum O(n). Spread across n appends, the average accounted cost is O(1); individual appends can still take Θ(n).' },
      { question: 'Must O(n) time use O(n) memory?', answer: 'No. A running sum scans n elements with O(1) auxiliary words. Time and live storage measure different resources.' },
    ],
    exercises: [
      { problem: 'Give a tight bound for 7n³+20n²+5.', solution: 'Θ(n³). For n≥1 it is between 7n³ and 32n³, proving both constant-factor bounds.' },
      { problem: 'Sort n values, then perform n binary searches. Total time?', solution: 'O(n log n)+n·O(log n)=O(n log n). Sequential phases add rather than multiply.' },
      { problem: 'An inner loop runs i times for i=1,2,4,…≤n. Total work?', solution: 'The sum 1+2+4+… is below 2n and its final term is a linear fraction of n, giving Θ(n).' },
    ],
  },
});

export const BASIC_FULL_LESSONS: Record<string, Lesson> = Object.fromEntries(
  [recursion, binarySearch, traversal, sorting, trees, bigO].map(lesson => [lesson.moduleId, lesson]),
);
