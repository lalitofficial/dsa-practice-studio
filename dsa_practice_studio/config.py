from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
SHEET_DIR = BASE_DIR / "leetcode-striver"
LEGACY_DATA_DIR = BASE_DIR / ".striver_tracker"
DATA_DIR = BASE_DIR / ".dsa_practice_studio"
if not DATA_DIR.exists() and LEGACY_DATA_DIR.exists():
    DATA_DIR = LEGACY_DATA_DIR
STATE_PATH = DATA_DIR / "state.json"
LESSONS_PATH = DATA_DIR / "lessons.json"
UNIT_DB_PATH = DATA_DIR / "tracker.db"

QUESTION_EXTS = {".py", ".ipynb"}

DEFAULT_SHEET_ID = "striver"
SHEETS = {
    "striver": {"name": "Striver A2Z", "html": BASE_DIR / "striver_ref_file.html"},
    "algomaster": {"name": "AlgoMaster", "html": BASE_DIR / "algomaster_ref.html"},
}

ALGOMASTER_GROUPS = {
    "Arrays": ("Arrays & Pointers", "Arrays"),
    "Matrix (2D Array)": ("Arrays & Pointers", "Matrix (2D Array)"),
    "Two Pointers": ("Arrays & Pointers", "Two Pointers"),
    "Fast and Slow Pointers": ("Linked List", "Fast and Slow Pointers"),
    "Prefix Sum": ("Arrays & Pointers", "Prefix Sum"),
    "Kadane's Algorithm": ("Arrays & Pointers", "Kadane's Algorithm"),
    "Monotonic Queue": ("Arrays & Pointers", "Monotonic Queue"),
    "Monotonic Stack": ("Arrays & Pointers", "Monotonic Stack"),
    "Sliding Window - Fixed Size": ("Sliding Window", "Fixed Size"),
    "Sliding Window - Dynamic Size": ("Sliding Window", "Dynamic Size"),
    "Strings": ("Strings", "Strings"),
    "String Matching": ("Strings", "String Matching"),
    "Suffix Array": ("Strings", "Suffix Array"),
    "Tries": ("Strings", "Tries"),
    "Linked List": ("Linked List", "Core"),
    "LinkedList In-place Reversal": ("Linked List", "In-place Reversal"),
    "Stacks": ("Stacks & Queues", "Stacks"),
    "Queues": ("Stacks & Queues", "Queues"),
    "Hash Tables": ("Hashing", "Hash Tables"),
    "BST / Ordered Set": ("Trees", "BST / Ordered Set"),
    "Tree Traversal - In Order": ("Trees", "Traversal - In Order"),
    "Tree Traversal - Pre Order": ("Trees", "Traversal - Pre Order"),
    "Tree Traversal - Post-Order": ("Trees", "Traversal - Post-Order"),
    "Tree Traversal - Level Order": ("Trees", "Traversal - Level Order"),
    "Breadth First Search (BFS)": ("Graphs", "Breadth First Search (BFS)"),
    "Depth First Search (DFS)": ("Graphs", "Depth First Search (DFS)"),
    "Topological Sort": ("Graphs", "Topological Sort"),
    "Union Find": ("Graphs", "Union Find"),
    "Minimum Spanning Tree": ("Graphs", "Minimum Spanning Tree"),
    "Shortest Path": ("Graphs", "Shortest Path"),
    "Eulerian Circuit": ("Graphs", "Eulerian Circuit"),
    "Heaps": ("Heaps & Top K", "Heaps"),
    "Two Heaps": ("Heaps & Top K", "Two Heaps"),
    "Top K Elements": ("Heaps & Top K", "Top K Elements"),
    "K-Way Merge": ("Heaps & Top K", "K-Way Merge"),
    "Binary Search": ("Sorting & Searching", "Binary Search"),
    "Merge Sort": ("Sorting & Searching", "Merge Sort"),
    "QuickSort / QuickSelect": ("Sorting & Searching", "QuickSort / QuickSelect"),
    "Bucket Sort": ("Sorting & Searching", "Bucket Sort"),
    "Divide and Conquer": ("Sorting & Searching", "Divide and Conquer"),
    "Greedy": ("Greedy & Intervals", "Greedy"),
    "Intervals": ("Greedy & Intervals", "Intervals"),
    "Line Sweep": ("Greedy & Intervals", "Line Sweep"),
    "1-D DP": ("Dynamic Programming", "1-D DP"),
    "2D (Grid) DP": ("Dynamic Programming", "2D (Grid) DP"),
    "Knapsack DP": ("Dynamic Programming", "Knapsack DP"),
    "Unbounded Knapsack DP": ("Dynamic Programming", "Unbounded Knapsack DP"),
    "Digit DP": ("Dynamic Programming", "Digit DP"),
    "Probability DP": ("Dynamic Programming", "Probability DP"),
    "State Machine DP": ("Dynamic Programming", "State Machine DP"),
    "Longest Increasing Subsequence DP": (
        "Dynamic Programming",
        "Longest Increasing Subsequence DP",
    ),
    "Tree / Graph DP": ("Dynamic Programming", "Tree / Graph DP"),
    "Bitmask DP": ("Dynamic Programming", "Bitmask DP"),
    "String DP": ("Dynamic Programming", "String DP"),
    "Maths / Geometry": ("Math & Geometry", "Maths / Geometry"),
    "Bit Manipulation": ("Bit Manipulation", "Bit Manipulation"),
    "Recursion": ("Recursion & Backtracking", "Recursion"),
    "Backtracking": ("Recursion & Backtracking", "Backtracking"),
    "Data Structure Design": ("Data Structures", "Data Structure Design"),
    "Binary Indexed Tree / Segment Tree": (
        "Data Structures",
        "Binary Indexed Tree / Segment Tree",
    ),
}
