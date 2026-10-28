import type { LessonVisualSpec } from '../types/lessonVisual';
import type { Lesson } from './lessons';

export const EXTRA2_LESSONS: Record<string, Lesson> = {
  "GROUP 2 - ALGORITHM ANALYSIS": {
    moduleId: "GROUP 2 - ALGORITHM ANALYSIS",
    title: "GROUP 2 - ALGORITHM ANALYSIS",
    description: "Measuring algorithm efficiency and Big-O notation.",
    difficulty: "Intermediate",
    readingTime: "25 min",
    objectives: ["Define time and space complexity", "Use Big-O notation", "Compare best/average/worst cases", "Analyze loops and nested loops"],
    sections: [
      { heading: "Measuring Time Complexity", body: "Time complexity abstracts hardware differences by counting elementary operations as a function of input size n. For the array-print loop, each iteration does one access and one print, so the operation count is proportional to n and the complexity is O(n). Doubling the input doubles the steps — the hallmark of linear growth. Independent of language, CPU, or memory, the operation count captures intrinsic scaling." },
      { heading: "Space Complexity", body: "Measures additional memory beyond the input. In-place sort uses O(1) or O(n) extra; merge sort allocates an auxiliary array of size n yielding O(n) extra space. Recursion contributes via the call stack: depth n costs O(n) stack even if explicit data is O(1). Constants (one temp variable) count as O(1); arrays and hash tables count fully." },
      { heading: "Best/Average/Worst Cases", body: "Best case: favorable input (sorted for insertion sort): O(n). Average: expected over representative distribution. Worst case (reverse sorted): O(n^2). When saying 'Time complexity is X', specify which case. Worst case is the standard comparison unit — guaranteed upper bound, least sensitive to distribution assumptions." },
      { heading: "Linear Scan Worked Example", body: "Function find_max(arr): max_value=arr[0]; for x in arr: if x > max_value: max_value=x; return max_value. Worst case strictly increasing (max updates each step). Best case strictly decreasing. Either way O(n) operations; memory O(1). Linear scan is optimal for unsorted max finding — every element must be inspected to rule it out." },
      { heading: "Nested Loops", body: "Outer i 0..n-1, inner j 0..n-1 => n^2 iterations => O(n^2). Outer i with inner j 0..n-1-i: sum approximates n^2/2 => still O(n^2). When inner bound shrinks exponentially (i halves each step) total collapses to O(n). Count carefully, then drop constants and lower terms." },
      { heading: "Properties of Big-O", body: "Transitive: f=O(g), g=O(h) implies f=O(h). Constant rule: c*f stays O(f). Multiple-terms: f+g is O(max(f,g)). Composition and products apply for nested or sequential. Use these to simplify expressions, then verify with the limit test (lim f/g). If ratio is finite non-zero: Theta; 0: O; infinity: Omega." },
      { heading: "Practical Tuning", body: "Beyond Big-O: constant factors, cache locality (sequential vs pointer-chasing), allocation overhead. For n under 1000 these dominate. Big-O decides scalability; profiling decides constant factor. A cache-friendly O(n^2) can beat cache-missing O(n log n) at moderate n. Always measure." },
      { heading: "Practice with Solutions", body: "Q1: sort cost O(n log n) + n binary searches O(n log n) ⇒ O(n log n). Q2: nested loop tracking i+j ⇒ O(n^2). Q3: iterative i doubling ⇒ O(log n). Q4: is Big-O upper or tight bound? Upper. Q5: space O(1) for n-iteration with one temp. Mirror careful analysis measurably." },
    ],
    summary: "Algorithm analysis quantifies efficiency via time/space complexity, Big-O notation, and operation counting.",
    reviewQuestions: ["State Big-O vs Big-Theta.", "Analyze a nested-loop snippet.", "Why ignore constants?"],
  },
};
