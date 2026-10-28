import { fullLesson, section } from './fullLessonHelpers';

export const EMERGING_FULL_LESSON = fullLesson({
  moduleId: 'Module 8.2 - EMERGING TOPICS',
  title: 'Emerging Topics: Online, Streaming, Quantum, and AI Algorithms',
  description: 'A complete discussion of the four families in the imported module: decisions without future input, computation with limited memory, quantum search, and learning from data.',
  difficulty: 'Advanced',
  objectives: [
    'Distinguish online, offline, and streaming computation and state their constraints.',
    'Trace LRU, FIFO, ski rental, bin packing, and online scheduling on actual inputs.',
    'Maintain exact stream statistics and explain when approximation or sampling is useful.',
    'Explain qubits, quantum gates, interference, entanglement, and Grover search.',
    'Compare machine learning, neural networks, decision trees, and NLP using training and evaluation examples.',
  ],
  sections: [
    section('1. Why emerging algorithms need different models', `An algorithm is a procedure for turning inputs into outputs. Its design depends on what information is available and which resources are scarce. The familiar offline model assumes the whole input is available before processing. Sorting a completed list is an offline task because the algorithm can examine and rearrange all its elements.

An online algorithm must decide as requests arrive without knowing the future. A streaming algorithm also receives data over time, but its central concern is maintaining useful results using limited memory and few passes. Quantum algorithms use quantum states and operations as a computational resource. AI algorithms often learn parameters from examples rather than having every decision rule written by hand.

These categories can overlap. A fraud detector may use a trained model on a transaction stream while making an immediate online decision. For every problem, identify the input, required output, allowed information, memory limit, and quality measure before choosing an algorithm. “Emerging” describes the topics being studied; it does not mean that every algorithm is newly invented.`),
    section('2. Online decisions and competitive analysis', `An offline cache manager could inspect tomorrow’s requests before choosing which item to evict. An online cache manager cannot. It must use the requests seen so far. A decision that looks sensible now can become expensive when the next request arrives, even if the implementation is correct.

Competitive analysis measures the cost of an online rule against an optimal offline algorithm on the same input sequence. For a minimization problem, a bound of cost(online) ≤ c × cost(offline optimum) + b is a c-competitive guarantee, where b does not grow with the input sequence. The comparator is allowed to know the future; the online algorithm is not.

A competitive ratio is a guarantee about solution quality across sequences, not the running time of the program. A cache operation may take constant time and still produce many misses. Conversely, a more elaborate decision rule may reduce misses while using more processing per request. Keep execution cost and decision quality separate when reviewing an online algorithm.`),
    section('3. LRU and FIFO: two cache eviction policies', `A cache of capacity k holds at most k items. A hit occurs when a requested item is present. A miss requires loading the item, and a full cache must evict something. Least Recently Used (LRU) evicts the item whose most recent access is oldest. A hit updates recency because the item has just been used.

First In, First Out (FIFO) evicts the item that entered earliest. Hits do not move an item to the back of the insertion queue. This difference matters: an old but frequently accessed item can survive in LRU and still be evicted by FIFO. FIFO is simple, but increasing its cache size does not always reduce its misses; this is the phenomenon called Belady’s anomaly.

With a hash map and doubly linked list, LRU lookups and recency updates can be implemented in average O(1) time, using O(k) space. FIFO can use a queue plus a membership set. Neither policy predicts future requests, and neither is always identical to the offline optimum.`, {
      example: { problem: 'Capacity 3; requests A, B, C, A, D, A. Track entries from oldest to newest.', steps: ['After A, B, C, both policies hold [A, B, C] and have 3 misses.', 'Request A is a hit. LRU becomes [B, C, A]; FIFO stays [A, B, C].', 'Request D is a miss. LRU evicts B → [C, A, D]; FIFO evicts A → [B, C, D].', 'The last A is a hit in LRU and a miss in FIFO.'], answer: 'LRU: 4 misses. FIFO: 5 misses. The difference comes from how each policy handles a hit.' },
    }),
    section('4. Ski rental: committing without knowing duration', `Suppose renting equipment costs 10 per day and buying costs 100. The number of days you will need it is unknown. Buying immediately wastes money if you stop after one day; renting forever becomes expensive if usage continues. This is the ski-rental problem, a model for decisions such as renting servers versus committing to a longer-term purchase.

A simple deterministic threshold rule rents for 9 days and buys at the start of day 10 if usage continues. If you stop during those first 9 days, it pays exactly what an offline optimum would pay. If you continue, its total cost is 90 + 100 = 190, while the offline optimum would have bought for 100.

The worst ratio in this example is 1.9. In the standard discrete model with rental cost 1 and integer purchase cost B, the analogous rule has ratio (2B − 1)/B, approaching 2 as B grows. The point is to limit regret from not knowing the future, rather than to guess the exact stopping day.`),
    section('5. Online bin packing and scheduling', `Online bin packing assigns arriving items to bins of fixed capacity. Once placed, items are usually not moved. First Fit scans existing bins and uses the first one with enough remaining space; it opens a new bin if none fits. Best Fit instead picks the feasible bin with the least space left afterward. These are different heuristics, and either can leave gaps that future items cannot use.

With capacity 10 and arrivals 6, 6, 4, 4, First Fit creates bins [6, 4] and [6, 4]. A naive implementation can inspect O(b) bins per arrival when b bins are open. Data structures can change search cost, but the packing decision still depends on the arrival order.

Online scheduling assigns jobs to processors without knowing future arrivals. List scheduling places the next job on a currently least-loaded processor. For two processors and jobs 3, 2, 4, 1, using processor 1 to break ties, the final loads are 4 and 6. The completion time, or makespan, is 6; an offline arrangement could achieve 5 by pairing 4 + 1 and 3 + 2.`),
    section('6. Streams and state: computing without saving everything', `A data stream is a sequence whose items arrive over time, possibly too quickly or in too great a volume to store completely. A streaming algorithm keeps a state: the information needed to update its answer when the next item arrives. State design determines both memory use and what questions the algorithm can answer later.

For a running sum, the state is one total. For an average, keep sum and count. For a maximum, keep the largest value seen. A one-pass algorithm updates these values per item and can discard the original item afterward. Fixed-size machine words give constant auxiliary storage for bounded numeric ranges; mathematically, an exact count up to n needs Θ(log n) bits.

Small state is not sufficient for every exact query. To answer “how many distinct arbitrary IDs have appeared?” exactly, a set may grow with the number of distinct IDs. The difficulty comes from the query being asked, rather than merely from the fact that data arrives as a stream.`, {
      code: 'count = 0\ntotal = 0\nabove_threshold = 0\nfor temperature in readings:\n    count += 1\n    total += temperature\n    if temperature > 35:\n        above_threshold += 1\naverage = total / count if count else None',
      example: { problem: 'Process readings 34, 36, 38, 32, 40 without saving the list.', steps: ['Running sums: 34, 70, 108, 140, 180.', 'Counts above 35: 0, 1, 2, 2, 3.', 'After 5 readings, divide total 180 by count 5.'], answer: 'Average = 36; exactly 3 readings exceed 35. Each update takes constant time in the fixed-word model.' },
    }),
    section('7. Exact versus approximate streaming answers', `Exact streaming algorithms return the precise answer for their supported query. Counting threshold crossings is already cheap: one counter is enough. Replacing that counter with a sketch would not automatically save useful memory. Approximation is more valuable when exact state would be large, as in distinct counting or frequency estimation across many keys.

An approximate answer needs a stated error model. Absolute error is |estimate − true value|. Relative error divides this quantity by the nonzero true value. For a true count of 5,000 and an estimate of 4,800, absolute error is 200 and relative error is 200 / 5,000 = 4%. A probabilistic guarantee also states how likely the error bound is to hold.

Different sketches have different guarantees, so “approximate” does not imply an arbitrary fixed accuracy such as 96%. Consider the stream length, domain size, memory budget, error tolerance, and failure probability together. If the exact solution is already small and fast, use it unless another constraint supplies a reason to approximate.`),
    section('8. Sampling a stream fairly', `Sampling retains a subset of observations for analysis. Keeping every tenth reading is systematic sampling; choosing randomly is random sampling. Systematic sampling can be biased by periodic data: if a sensor spikes every tenth reading, always taking the same phase can either overrepresent or miss those spikes.

Reservoir sampling maintains a uniform sample of size k when the stream length is unknown. Store the first k items. At the t-th item, where t > k, draw an integer uniformly from 1 through t. If the integer is at most k, replace that reservoir position; otherwise discard the new item. Storage is O(k), and every item has probability k/t of being retained after t observations.

For k = 1, keep the first item, replace it with the second with probability 1/2, and replace it with the third with probability 1/3. After three items, each has probability 1/3 of being the current sample. A representative sample supports estimates; it does not guarantee that a rare event appears or reconstruct every original observation.`),
    section('9. Bits, qubits, and measurement', `A classical bit has value 0 or 1. A pure qubit state can be written α|0⟩ + β|1⟩, where α and β are complex probability amplitudes satisfying |α|² + |β|² = 1. A standard-basis measurement returns 0 with probability |α|² or 1 with probability |β|².

Superposition does not let a program read both answers from one measurement. The algorithm must manipulate amplitudes so that useful results become more likely when measured. The relative phase between amplitudes affects how later operations combine them, even when the current measurement probabilities are unchanged.

With two qubits, the basis states are |00⟩, |01⟩, |10⟩, and |11⟩. A general state assigns an amplitude to each. The number of basis amplitudes grows exponentially with the number of qubits, but that fact alone is not a proof of an exponential speedup: loading input, implementing operations, and extracting useful results all have costs.`),
    section('10. Quantum gates, interference, and entanglement', `Quantum gates transform states. X exchanges |0⟩ and |1⟩. H maps |0⟩ to (|0⟩ + |1⟩)/√2 and |1⟩ to (|0⟩ − |1⟩)/√2. Z leaves the |0⟩ amplitude unchanged and changes the sign of the |1⟩ amplitude. Z therefore changes phase without changing immediate standard-basis probabilities.

Interference occurs when amplitudes combine. Applying H twice returns the original basis state: H(H|0⟩) = |0⟩. The amplitudes for the |1⟩ outcome cancel. This illustrates why a superposition is not simply a classical random choice between two hidden values.

CNOT flips its target only when the control is 1. Apply H to the first qubit of |00⟩, then CNOT with that qubit as control: the result is (|00⟩ + |11⟩)/√2. This Bell state is entangled and cannot be written as two independent single-qubit states. Its correlated outcomes do not provide a way to transmit information faster than light.`),
    section('11. Grover search: a complete four-candidate trace', `Grover search amplifies marked states in an unstructured search problem. Its oracle recognizes a correct candidate and reverses that candidate’s phase. The diffusion operation reflects amplitudes about their average. Repeating those operations makes marked outcomes likely at measurement.

For one marked item among N possibilities, the ideal query complexity is O(√N), compared with Θ(N) classical worst-case queries. The speedup concerns oracle calls under the search model. It is not a promise that loading an arbitrary classical database or running on present hardware becomes that much faster.

For a large search space with one solution, the useful iteration count is approximately (π/4)√N, with rounding and a small correction; it is not (π/2)√N. Too many repetitions can reduce the success probability. With several marked items, the count depends on their fraction. The four-candidate example below reaches the marked state after one iteration.`, {
      example: { problem: 'Search {|00⟩, |01⟩, |10⟩, |11⟩}; mark |10⟩.', steps: ['Prepare amplitudes [1/2, 1/2, 1/2, 1/2] with Hadamard gates.', 'The oracle flips the marked amplitude: [1/2, 1/2, −1/2, 1/2]. Probabilities are still all 1/4.', 'The mean amplitude is 1/4. Diffusion maps each amplitude a to 2(1/4) − a.', 'The resulting amplitudes are [0, 0, 1, 0].'], answer: 'An ideal standard-basis measurement returns |10⟩ with probability 1. The oracle alone changed phase; diffusion converted that phase difference into a probability difference.' },
    }),
    section('12. Quantum resource complexity and limits', `Quantum resource analysis includes qubit count, number of oracle calls, gate count, circuit depth, and measurement repetitions. Query complexity counts calls to an abstract oracle. Gate complexity also counts the operations needed to implement that oracle and the rest of the circuit. An efficient query algorithm can still have an expensive implementation.

A classical linear scan over N candidates and Grover’s O(√N) ideal query bound solve an unstructured problem. A sorted array with random access admits classical binary search in O(log N); comparing Grover only with linear search would ignore that extra structure. Always compare methods that receive the same information and solve the same task.

Noise, error correction, data preparation, and repeated measurements affect practical execution. Quantum algorithms offer advantages for particular problems and models, rather than uniformly replacing classical algorithms. In a reviewer answer, identify the problem assumptions before stating the resource bound.`),
    section('13. AI algorithms: training, inference, and evaluation', `AI algorithms use data and computational rules to make predictions or decisions. In supervised machine learning, training examples pair inputs with target labels or values. The learner adjusts parameters to reduce a loss on training data. Inference applies the learned parameters to an input to produce an output.

For an email classifier, input features might describe word occurrences, the label is spam or not spam, and the model outputs a score or category. Splitting data into training, validation, and test sets separates learning, model selection, and final evaluation. Reusing the test set to choose the model leaks information and makes the final result too optimistic.

Generalization means performing well on new data from the relevant setting. A model can memorize training examples and still fail on future inputs; this is overfitting. Evaluation should match the task: accuracy may be useful for balanced classification, while rare-event detection also needs attention to precision, recall, and the costs of different mistakes.`),
    section('14. Neural networks and decision trees', `A neural network composes layers of weighted transformations and nonlinear activations. Training adjusts the weights to reduce a chosen loss, usually using gradients. Additional depth and parameters can represent complex relationships, but also increase training cost and the need to control overfitting. A network’s artificial neurons are mathematical operations; biological inspiration does not make it equivalent to a brain.

A decision tree instead applies a sequence of tests. For example: “study hours ≥ 5?” followed by “practice score ≥ 70?” leads to a predicted category at a leaf. A decision path is easy to inspect, but a deep tree can overfit small differences in training examples. Restricting depth or pruning can improve generalization.

These approaches differ in representation, cost, and interpretability. Tree inference follows one path and is O(h) in tree height. A dense neural layer with d inputs and m outputs performs work proportional to d × m per example. Neither model is universally best; choose and evaluate it against the actual prediction task.`),
    section('15. NLP, applications, and a final comparison', `Natural language processing (NLP) is a field of tasks involving text or speech, including classification, translation, retrieval, and generation. It is not one specific algorithm. A system may tokenize text, create representations, apply a learned model, and decode an output. Neural networks and decision trees are model families; NLP is an application area that can use different models.

Healthcare prediction, traffic forecasting, business demand analysis, and educational feedback illustrate AI applications. The system still needs relevant data and evaluation. Bias in the examples, changing input distributions, or unclear labels can harm performance even when the optimization procedure works as designed.

Review the four families by their main constraint: online algorithms lack future input; streaming algorithms limit retained state; quantum algorithms manipulate amplitudes and account for quantum resources; learning algorithms fit patterns and must generalize. In a mixed system, discuss each component separately instead of treating “AI,” “online,” or “quantum” as a guarantee of speed or correctness.`),
  ],
  summary: 'Online algorithms make decisions with incomplete future information; streaming algorithms maintain state under memory limits; quantum algorithms use phase and interference to obtain task-specific resource advantages; AI algorithms learn patterns and require careful evaluation. Explain the input assumptions, trace a small example, state cost and quality guarantees, and identify limitations for each family.',
  reviewer: {
    keyFacts: ['Online ≠ internet-based: the defining constraint is not knowing future input.', 'LRU updates recency on a hit; FIFO preserves insertion order.', 'Competitive ratio measures decision quality against offline optimum, not CPU speed.', 'Streaming exact count needs one counter; exact arbitrary distinct counting may need much larger state.', 'Relative error = |estimate − true| / |true| when the true value is nonzero.', 'A uniform reservoir of size k retains each of t items with probability k/t.', 'Measurement probabilities are squared amplitude magnitudes; phase affects later interference.', 'X flips basis states; Z changes relative phase; H creates and recombines superpositions.', 'Grover search uses O(√N) ideal oracle queries for one marked item.', 'Training fits parameters; inference uses them; test evaluation measures generalization.'],
    questions: [
      { question: 'How are online and streaming algorithms different?', answer: 'Online emphasizes deciding without future input. Streaming emphasizes processing a sequence using limited retained state and passes. A cache eviction policy is online; a one-pass average is streaming. A system can be both.' },
      { question: 'Why do LRU and FIFO diverge after a hit?', answer: 'LRU moves the accessed item to the most-recent end. FIFO leaves its arrival position unchanged. A later miss may therefore evict different items even when both policies previously held the same set.' },
      { question: 'What does a 2-competitive minimization algorithm guarantee?', answer: 'Its cost is at most twice the offline optimum plus a sequence-independent additive constant, under the stated model. It does not necessarily run twice as fast or return the exact optimum.' },
      { question: 'When is approximation worth using in streaming?', answer: 'When the exact state or processing cost is too large and the task permits a specified error and failure probability. Counting a threshold needs only a counter, whereas estimating many distinct IDs may benefit from a sketch.' },
      { question: 'Is superposition equivalent to obtaining every answer at once?', answer: 'No. Measurement produces one outcome. Useful quantum algorithms arrange interference so desirable outcomes have high measurement probability.' },
      { question: 'Why does the Grover oracle not immediately improve success probability?', answer: 'It reverses the marked amplitude’s sign, leaving its squared magnitude unchanged. Diffusion then uses that phase difference to amplify the marked state.' },
      { question: 'Can CNOT create entanglement from every input?', answer: 'No. On |00⟩ it leaves a product state. After H on the control, CNOT produces (|00⟩ + |11⟩)/√2, an entangled state. The input matters.' },
      { question: 'What are the difference between a model family and an application field?', answer: 'Decision trees and neural networks are model families. NLP is a field of language tasks that may use either learned models or other algorithms. Machine learning is the broader approach of learning from examples.' },
      { question: 'Why keep test data separate from validation data?', answer: 'Validation guides choices such as model size and thresholds. The test set supplies an independent final estimate. Repeatedly selecting models using test results makes that estimate biased.' },
    ],
    exercises: [
      { problem: 'Cache capacity 2; requests A, B, A, C, A. Trace LRU and FIFO. Count misses.', solution: 'LRU: [A] miss; [A,B] miss; [B,A] hit; [A,C] miss; [C,A] hit → 3 misses. FIFO: [A] miss; [A,B] miss; [A,B] hit; [B,C] miss (A evicted); [C,A] miss → 4 misses.' },
      { problem: 'A stream is 10, 20, 15, 35. Find the exact mean and number strictly above 20. An estimate reports 2 qualifying items: what is its relative error?', solution: 'Sum = 80, count = 4, mean = 20. Only 35 exceeds 20, so the exact threshold count is 1. Relative error = |2 − 1| / 1 = 100%. A running sum, count, and threshold counter suffice.' },
      { problem: 'In the four-state Grover example, apply diffusion to [0.5, 0.5, −0.5, 0.5]. Explain the result using amplitudes.', solution: 'Mean = 0.25. Reflect by 2 × mean − a: the three positive 0.5 amplitudes become 0; −0.5 becomes 1. The result [0,0,1,0] has total probability 1 and yields the third basis state |10⟩ in the ideal circuit.' },
      { problem: 'A classifier is correct on 990 of 1,000 records, but all 10 fraud cases are missed. Is accuracy enough?', solution: 'Accuracy is 99%, but fraud recall is 0/10 = 0. Inspect the confusion matrix, precision and recall, and costs of misses. A useful evaluation must reflect the task, not only a high overall accuracy.' },
    ],
  },
  references: [
    { title: 'MIT 6.854: Online Algorithms', url: 'https://courses.csail.mit.edu/6.854/21/Notes/n25-online.html' },
    { title: 'IBM Quantum: Grover iteration count', url: 'https://quantum.cloud.ibm.com/learning/en/courses/fundamentals-of-quantum-algorithms/grover-algorithm/number-of-iterations' },
  ],
});
