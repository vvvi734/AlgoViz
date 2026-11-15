/**
 * AlgoLens legacy data definitions.
 *
 * These four objects are copied verbatim from the original single-file
 * `index.html` (v0.1 prototype, lines 65-210). They are kept ONLY as the
 * regression oracle: `npm run sync:legacy` derives the typed application data
 * modules and the frame snapshots from this file.
 *
 * The application itself never imports this file at runtime.
 * DO NOT edit the algorithm code strings here — change `docs/` proposals and
 * the generated modules instead, then re-capture the baseline deliberately.
 */

export const I = {
 zh:{programLang:'语言',apiConfig:'AI 接口设置',learn:'◈ 算法实验室',practice:'▤ 大学 / 考研题库',custom:'✦ AI 导入算法',interactive:'交互式可视化',play:'▶ 播放',pause:'Ⅱ 暂停',speed:'速度',timelineHint:'拖动时间轴 · 暂停 · 回退 · 逐帧前进',codeEditor:'⌘ 算法代码编辑器',restore:'恢复示例',run:'运行并可视化',input:'输入（JSON）',random:'随机数据',traceNote:"编辑代码后用 trace({type:'array', values:[...arr], focus:[i,j]}, '步骤说明') 记录状态。代码在限时 Worker 中执行；任意代码不会自动推断出准确动画。",concept:'知识速览',timeCost:'平均时间复杂度',spaceCost:'额外空间复杂度',stepLog:'执行日志',aiMentor:'AI 学习助教',mentorDesc:'优先给提示、追问和思路，而不是直接给出完整答案。',mentorPlaceholder:'我不理解为什么这里要交换元素……',askAi:'获得引导',questionList:'大学 / 考研练习题库',all:'全部',university:'大学基础',postgrad:'考研强化',bankDisclaimer:'内置原创示例题，不是官方历年真题；正式题库需授权内容和服务端管理。',scaffold:'补全代码框架',test:'运行测试',hint:'循序提示',review:'AI 代码点评',resetScaffold:'重置框架',customTitle:'用自然语言导入想学的算法',customIntro:'描述你想学习的算法；连接 AI 代理后可生成可视化示例。AI 生成默认使用 JavaScript，其他语言通过代码编辑器切换。',describeAlgo:'描述算法',customPlaceholder:'例如：用双指针实现有序数组去重，每次移动指针时可视化',generate:'AI 生成可视化代码',localDemo:'试用本地示例',integration:'集成原理与安全说明',howItWorks:'状态快照机制',howDetail:'可视化引擎展示算法每一步发出的 trace 快照，而非直接猜测任意程序的内存状态。AI 生成代码也需要使用同样的数据约定。',apiSecurity:'API Key 不应存入 HTML',apiSecurityDetail:'浏览器只请求你自己的后端 /api/ai。密钥由服务器保存，且应限制请求速率、校验生成代码、控制成本。',grading:'更严谨的在线判题',gradingDetail:'本原型用浏览器 Worker 跑演示测试。正式系统应在服务端隔离沙箱内运行代码，设置隐藏测试、资源限制及账户持久化。',apiExplainer:'填写你部署的后端 AI 代理地址（不是模型厂商的直连密钥接口），前端仅发送任务及学习上下文。',endpoint:'AI 代理 URL',apiContract:'POST JSON: {action, payload, language}；返回 {reply} 或 {title, code, input, type}，建议只允许 HTTPS 或同源。',save:'保存',footer:'AlgoLens 原型 · 原生 HTML / CSS / JS · 无外部脚本 · 演示可离线使用',step:'步骤',ready:'请运行代码以生成步骤',running:'正在执行代码…',loaded:'动画已生成',error:'执行出错',noTrace:'代码没有调用 trace()，无法形成动画。',workerTimeout:'执行超时（3 秒），已终止 Worker。',syntax:'输入必须是有效 JSON',noApi:'AI 代理尚未连接。请先设置后端地址并部署对应接口；本地示例无需联网。',generating:'正在请求 AI 生成…',generated:'生成成功，已加载到实验室。请检查代码，然后点击运行。',failed:'接口调用失败',aiUnavailable:'未连接 AI 后端，先提供本地启发式提示。',passed:'通过',failedTest:'未通过',testSummary:'测试结果',hintIntro:'提示',answerWarn:'AI 建议仅用于理解问题；最终仍需用测试验证代码。',choose:'选择题目',filterAll:'全部',levelEasy:'基础',levelMid:'进阶',emptyStack:'结构为空',invalidTrace:'无效可视化状态',progress:'学习进度仅保存在本机浏览器',apiConnected:'已设置 AI 代理地址',customName:'自定义算法'},
 en:{programLang:'Language',apiConfig:'AI API Settings',learn:'◈ Algorithm Lab',practice:'▤ University / Exam Practice',custom:'✦ Import with AI',interactive:'INTERACTIVE VISUALIZER',play:'▶ Play',pause:'Ⅱ Pause',speed:'Speed',timelineHint:'Scrub timeline · Pause · Rewind · Step forward',codeEditor:'⌘ Algorithm Code Editor',restore:'Restore preset',run:'Run & visualize',input:'Input (JSON)',random:'Random input',traceNote:"Edit the code and call trace({type:'array', values:[...arr], focus:[i,j]}, 'Step note') to record states. Code runs in a time-limited Worker; arbitrary code cannot be accurately visualized automatically.",concept:'At a glance',timeCost:'Average time complexity',spaceCost:'Auxiliary space complexity',stepLog:'Execution log',aiMentor:'AI Learning Coach',mentorDesc:'Hints and Socratic questions first—not the full solution.',mentorPlaceholder:'Why do we swap these elements here?',askAi:'Get guidance',questionList:'University / Postgrad Practice',all:'All',university:'University',postgrad:'Postgrad exams',bankDisclaimer:'Original sample exercises; not official past examination questions. A production bank needs licensed content and backend management.',scaffold:'Complete the code scaffold',test:'Run tests',hint:'Progressive hints',review:'AI code review',resetScaffold:'Reset scaffold',customTitle:'Import algorithms using natural language',customIntro:'Describe an algorithm. With your AI proxy, generate a trace-enabled demo. AI output currently defaults to JavaScript; switch languages in the editor.',describeAlgo:'Describe the algorithm',customPlaceholder:'For example: two pointers to deduplicate a sorted array, visualizing every pointer movement',generate:'Generate visual code',localDemo:'Load local demo',integration:'Integration & safety notes',howItWorks:'State snapshot protocol',howDetail:'The engine renders explicit trace snapshots, not inferred arbitrary memory changes. AI-generated algorithms must emit the same structured traces.',apiSecurity:'Never put API keys in HTML',apiSecurityDetail:'The browser calls only your backend /api/ai. Store keys on the server, validate outputs, rate-limit requests, and control cost.',grading:'Production-grade grading',gradingDetail:'This demo executes example tests in browser Workers. Production requires isolated server-side sandboxes, hidden tests, resource limits, and persistent accounts.',apiExplainer:'Enter your own backend AI proxy URL (not a direct provider endpoint requiring a secret key). The frontend sends task and learning context only.',endpoint:'AI proxy URL',apiContract:'POST JSON: {action, payload, language}; response: {reply} or {title, code, input, type}. Prefer HTTPS or same-origin.',save:'Save',footer:'AlgoLens Prototype · Vanilla HTML / CSS / JS · No external scripts · Offline demos',step:'STEP',ready:'Run code to create the timeline',running:'Running code…',loaded:'Visualization ready',error:'Execution error',noTrace:'Your code did not call trace(), so there are no frames.',workerTimeout:'Execution exceeded 3 seconds and was terminated.',syntax:'Input must be valid JSON',noApi:'AI backend is not connected. Configure and deploy an AI proxy; the local demo works offline.',generating:'Requesting AI generation…',generated:'Generated code loaded in the lab. Review it and press Run.',failed:'API request failed',aiUnavailable:'AI backend unavailable; showing local guiding hints.',passed:'Passed',failedTest:'Failed',testSummary:'Test results',hintIntro:'Hint',answerWarn:'AI feedback is a study aid; verify solutions with tests.',choose:'Select a problem',filterAll:'All',levelEasy:'Intro',levelMid:'Intermediate',emptyStack:'Empty structure',invalidTrace:'Invalid visualization state',progress:'Progress saved only on this browser',apiConnected:'AI proxy URL saved',customName:'Custom algorithm'}
};

export const ex = {
 bubble:{group:'sort',icon:'▥',name:['冒泡排序','Bubble sort'],desc:['反复比较相邻元素并交换逆序对；每一轮将当前最大值移动到末尾。','Compare adjacent elements, swap out-of-order pairs, and move the largest value to the end on each pass.'],time:'O(n²)',space:'O(1)',input:[5,2,8,1,6,3],code:`const arr = [...input];
trace({type:'array', values:[...arr]}, '初始数组 / Initial array');
for (let i = 0; i < arr.length - 1; i++) {
  for (let j = 0; j < arr.length - i - 1; j++) {
    trace({type:'array', values:[...arr], focus:[j,j+1]}, '比较相邻元素 / Compare neighbors');
    if (arr[j] > arr[j+1]) {
      [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
      trace({type:'array', values:[...arr], focus:[j,j+1]}, '交换 / Swap');
    }
  }
}
trace({type:'array', values:[...arr], done:true}, '排序完成 / Sorted');`},
 insertion:{group:'sort',icon:'▥',name:['插入排序','Insertion sort'],desc:['维护左侧有序部分，将当前元素插入正确位置。','Maintain a sorted prefix and insert the next element into its correct place.'],time:'O(n²)',space:'O(1)',input:[7,3,5,1,9,2],code:`const a=[...input]; trace({type:'array',values:[...a]},'开始 / Start');
for(let i=1;i<a.length;i++){
  const key=a[i]; let j=i-1;
  while(j>=0 && a[j]>key){a[j+1]=a[j]; trace({type:'array',values:[...a],focus:[j,j+1]},'右移 / Shift right');j--;}
  a[j+1]=key;trace({type:'array',values:[...a],focus:[j+1]},'插入 / Insert');
}
trace({type:'array',values:[...a],done:true},'完成 / Done');`},
 selection:{group:'sort',icon:'▥',name:['选择排序','Selection sort'],desc:['每轮选出未排序区间的最小值，与区间起点交换。','Find the minimum in the unsorted suffix and swap it to the front.'],time:'O(n²)',space:'O(1)',input:[6,4,9,1,7,2],code:`const a=[...input];trace({type:'array',values:[...a]},'开始 / Start');
for(let i=0;i<a.length;i++) {let m=i;
for(let j=i+1;j<a.length;j++){trace({type:'array',values:[...a],focus:[m,j]},'寻找最小值 / Find minimum');if(a[j]<a[m])m=j;}
[a[i],a[m]]=[a[m],a[i]];trace({type:'array',values:[...a],focus:[i,m]},'确定位置 / Place minimum');}
trace({type:'array',values:[...a],done:true},'完成 / Done');`},
 quick:{group:'sort',icon:'▥',name:['快速排序','Quicksort'],desc:['选择枢轴分区，递归处理左右子区间。','Partition around a pivot, then recursively sort the two partitions.'],time:'O(n log n)',space:'O(log n)',input:[8,3,1,7,5,2,9,4],code:`const a=[...input];trace({type:'array',values:[...a]},'开始 / Start');
function sort(l,r){if(l>=r)return; const pivot=a[r];let i=l;
for(let j=l;j<r;j++){trace({type:'array',values:[...a],focus:[j,r]},'与枢轴比较 / Compare pivot');if(a[j]<pivot){[a[i],a[j]]=[a[j],a[i]];trace({type:'array',values:[...a],focus:[i,j]},'分区交换 / Partition swap');i++;}}
[a[i],a[r]]=[a[r],a[i]];trace({type:'array',values:[...a],focus:[i]},'枢轴归位 / Pivot placed');sort(l,i-1);sort(i+1,r);}
sort(0,a.length-1);trace({type:'array',values:[...a],done:true},'完成 / Done');`},
 binary:{group:'search',icon:'⌕',name:['二分查找','Binary search'],desc:['在有序数组中每次排除一半搜索范围。输入对象包含 nums 与 target。','On a sorted array, eliminate half the search interval each step. Input has nums and target.'],time:'O(log n)',space:'O(1)',input:{nums:[1,3,5,7,9,11,13],target:9},code:`const a=input.nums, target=input.target;let l=0,r=a.length-1;
trace({type:'array',values:[...a]},'有序数组 / Sorted array');
while(l<=r){const m=Math.floor((l+r)/2);
trace({type:'array',values:[...a],focus:[m],range:[l,r]},'检查中间元素 / Check midpoint');
if(a[m]===target){trace({type:'array',values:[...a],focus:[m],done:true},'查找成功 / Found');break;}
if(a[m]<target)l=m+1;else r=m-1;
}
if(l>r)trace({type:'array',values:[...a]},'未找到 / Not found');`},
 linear:{group:'search',icon:'⌕',name:['线性查找','Linear search'],desc:['依次扫描每一个元素，直到找到目标值。','Scan elements sequentially until the target is found.'],time:'O(n)',space:'O(1)',input:{nums:[6,2,8,4,1],target:4},code:`const a=input.nums; trace({type:'array',values:[...a]},'开始 / Start');
let found=false;
for(let i=0;i<a.length;i++){trace({type:'array',values:[...a],focus:[i]},'检查当前位置 / Inspect');if(a[i]===input.target){trace({type:'array',values:[...a],focus:[i],done:true},'找到目标 / Found');found=true;break;}}
if(!found)trace({type:'array',values:[...a]},'未找到 / Not found');`},
 stack:{group:'ds',icon:'▤',name:['栈 · LIFO','Stack · LIFO'],desc:['后进先出：push 压栈，pop 弹栈。输入为操作列表。','Last in, first out: push onto the stack, pop from the top. Input is an operation list.'],time:'O(1)',space:'O(n)',input:[['push',4],['push',9],['push',2],['pop'],['push',7]],code:`const stack=[];trace({type:'stack',values:[...stack]},'空栈 / Empty stack');
for(const [op,value] of input){if(op==='push'){stack.push(value);}else if(op==='pop'){stack.pop();}
trace({type:'stack',values:[...stack],focus:[stack.length-1]},op+' '+(value??''));}`},
 queue:{group:'ds',icon:'≡',name:['队列 · FIFO','Queue · FIFO'],desc:['先进先出：enqueue 入队，dequeue 出队。','First in, first out: enqueue at the back, dequeue at the front.'],time:'O(1)*',space:'O(n)',input:[['enqueue',3],['enqueue',8],['enqueue',5],['dequeue'],['enqueue',2]],code:`const queue=[];trace({type:'queue',values:[...queue]},'空队列 / Empty queue');
for(const [op,value] of input){if(op==='enqueue')queue.push(value);else if(op==='dequeue')queue.shift();
trace({type:'queue',values:[...queue],focus:[0]},op+' '+(value??''));}`},
 linked:{group:'ds',icon:'⤳',name:['单向链表','Singly linked list'],desc:['节点包含值和 next 指针。演示在头部插入与删除头节点。','Each node has a value and next pointer. Demo inserts at head and removes the head.'],time:'O(1)',space:'O(n)',input:[['insert',3],['insert',8],['insert',5],['remove'],['insert',7]],code:`const list=[];trace({type:'linked',values:[...list]},'空链表 / Empty list');
for(const [op,val] of input){if(op==='insert')list.unshift(val);else if(op==='remove')list.shift();
trace({type:'linked',values:[...list],focus:[0]},op+' '+(val??''));}`},
 bfs:{group:'graph',icon:'◉',name:['广度优先搜索','Breadth-first search'],desc:['使用队列逐层遍历图，适合无权图最短路径。','Use a queue to visit graph nodes layer by layer; useful for shortest paths in unweighted graphs.'],time:'O(V+E)',space:'O(V)',input:{start:'A'},code:`const edges={A:['B','C'],B:['A','D','E'],C:['A','F'],D:['B'],E:['B','F'],F:['C','E']};
const q=[input.start||'A'], seen=new Set(q);
trace({type:'graph',visited:[...seen],focus:[q[0]]},'起点 / Start');
while(q.length){const n=q.shift();trace({type:'graph',visited:[...seen],focus:[n]},'访问 / Visit '+n);
for(const v of (edges[n]||[])){if(!seen.has(v)){seen.add(v);q.push(v);trace({type:'graph',visited:[...seen],focus:[v]},'加入队列 / Enqueue '+v);}}}`},
 dfs:{group:'graph',icon:'◉',name:['深度优先搜索','Depth-first search'],desc:['沿一条分支深入，直到无法前进后再回溯。','Explore a branch deeply, then backtrack to explore alternatives.'],time:'O(V+E)',space:'O(V)',input:{start:'A'},code:`const edges={A:['B','C'],B:['A','D','E'],C:['A','F'],D:['B'],E:['B','F'],F:['C','E']};
const seen=new Set();
function dfs(n){seen.add(n);trace({type:'graph',visited:[...seen],focus:[n]},'访问 / Visit '+n);
for(const v of (edges[n]||[]))if(!seen.has(v))dfs(v);
trace({type:'graph',visited:[...seen],focus:[n]},'回溯 / Backtrack '+n);}
dfs(input.start||'A');`},
 inorder:{group:'tree',icon:'♧',name:['二叉树中序遍历','Inorder traversal'],desc:['按左子树、根节点、右子树的顺序访问节点。','Visit the left subtree, root, then right subtree.'],time:'O(n)',space:'O(h)',input:[4,2,6,1,3,5,7],code:`const nodes=input;const seen=[];
trace({type:'tree',values:nodes,visited:[]},'开始 / Start');
function walk(i){if(i>=nodes.length||nodes[i]==null)return;walk(i*2+1);
seen.push(i);trace({type:'tree',values:nodes,visited:[...seen],focus:[i]},'访问 / Visit '+nodes[i]);
walk(i*2+2);}
walk(0);trace({type:'tree',values:nodes,visited:[...seen],done:true},'完成 / Done');`}
};

export const groups=[['sort','排序 / Sorting'],['search','查找 / Searching'],['ds','线性结构 / Linear DS'],['graph','图算法 / Graph'],['tree','树 / Trees']];

export const problems=[
 {id:'twoSum',cat:'university',diff:'easy',name:['两数之和','Two Sum'],desc:['给定整数数组 nums 和 target，返回两数之和等于 target 的一对下标；保证存在一解。','Given nums and target, return indices of a pair summing to target; exactly one answer exists.'],starter:`function solve({nums, target}) {\n  // TODO: 寻找两个下标 / Find two indices\n  return [];\n}`,tests:[[{nums:[2,7,11,15],target:9},[0,1]],[{nums:[3,2,4],target:6},[1,2]],[{nums:[3,3],target:6},[0,1]]],hints:[['先想想：每看到一个数，你需要的“另一半”是什么？','For each number, what complement are you looking for?'],['能否边遍历边记住已经见过的值与下标？','Could you remember past values and indices as you scan?'],['考虑用 Map 存储数值 → 下标，查询 target - nums[i]。','Use a Map from number to index; check target - nums[i].']]},
 {id:'validParen',cat:'university',diff:'easy',name:['有效括号','Valid parentheses'],desc:['判断仅包含 ()[]{} 的字符串是否满足正确匹配与嵌套。','Check whether a string containing only ()[]{} has correctly nested and matched brackets.'],starter:`function solve(s) {\n  // TODO: 使用一种线性数据结构 / Use a linear data structure\n  return false;\n}`,tests:[['()[]{}',true],['([{}])',true],['([)]',false],['(',false]],hints:[['后出现的左括号应该先被匹配。','The most recently opened bracket must close first.'],['这体现了栈的后进先出特性。','That suggests a stack (LIFO).'],['遇到左括号压栈，右括号检查栈顶，最终栈应为空。','Push openings, compare closing brackets to the stack top, and require an empty stack.']]},
 {id:'binaryFind',cat:'university',diff:'easy',name:['有序数组查找','Search sorted array'],desc:['在升序数组中查找 target，返回其下标；不存在时返回 -1。','Search for target in an ascending array; return its index or -1.'],starter:`function solve({nums, target}) {\n  let left = 0, right = nums.length - 1;\n  // TODO: 补全循环与区间更新 / Complete the search\n  return -1;\n}`,tests:[[{nums:[1,3,5,8,12],target:8},3],[{nums:[1,3,5],target:7},-1],[{nums:[],target:1},-1]],hints:[['维持目标可能存在的闭区间 [left, right]。','Maintain an inclusive candidate range [left, right].'],['检查中点，然后只保留可能的一侧。','Inspect the midpoint and keep only one possible half.'],['while (left <= right)；注意中点的 ±1 更新防止死循环。','Use while (left <= right) and update by midpoint ±1 to avoid infinite loops.']]},
 {id:'reverseList',cat:'university',diff:'mid',name:['反转链表序列','Reverse linked-list sequence'],desc:['用数组模拟链表节点的值，返回反转后的新数组，不要修改原始输入。','Simulate a linked list with an array of node values; return a reversed copy.'],starter:`function solve(values) {\n  // TODO: 用双指针或栈完成反转\n  return [];\n}`,tests:[[[1,2,3],[3,2,1]],[[],[]],[[8],[8]]],hints:[['考虑从尾到头访问元素。','Consider visiting elements from last to first.'],['也可以用两个指针向中间移动。','You can move two pointers toward the center.'],['别忘记避免修改传入的数组。','Avoid modifying the input array.']]},
 {id:'maxSubarray',cat:'postgrad',diff:'mid',name:['最大子段和','Maximum subarray sum'],desc:['给定非空整数数组，求连续非空子数组的最大和。','Find the maximum sum of any nonempty contiguous subarray.'],starter:`function solve(nums) {\n  // TODO: 设计一个状态，表示以当前位置结尾的最优解\n  return 0;\n}`,tests:[[[ -2,1,-3,4,-1,2,1,-5,4],6],[[-3,-2,-5],-2],[[5],5]],hints:[['先定义“以位置 i 结尾”的最大和。','Define the maximum sum ending at position i.'],['当前元素可以独立开始，也可以接在之前的最优后面。','Either start at the current element or extend the previous best ending here.'],['状态转移：cur = Math.max(nums[i], cur + nums[i])。','A useful recurrence is cur = Math.max(nums[i], cur + nums[i]).']]},
 {id:'countComponents',cat:'postgrad',diff:'mid',name:['无向图连通分量','Connected components'],desc:['给定 n 个顶点（0..n-1）与 edges 边列表，返回无向图连通分量个数。','Given n vertices (0..n-1) and undirected edges, return the number of connected components.'],starter:`function solve({n, edges}) {\n  // TODO: 构建邻接表，遍历未访问节点\n  return 0;\n}`,tests:[[{n:5,edges:[[0,1],[1,2],[3,4]]},2],[{n:3,edges:[]},3],[{n:4,edges:[[0,1],[1,2],[2,3]]},1]],hints:[['先用邻接表表达无向图。','Build an adjacency list for the undirected graph.'],['每发现一个尚未访问的顶点，就产生一个新连通分量。','Each unseen vertex starts a new component.'],['对该顶点做 DFS/BFS 标记其可达顶点，避免重复计数。','DFS/BFS from each new vertex to mark everything reachable.']]},
 {id:'lowerBound',cat:'postgrad',diff:'mid',name:['二分查找左边界','Lower bound'],desc:['在非递减数组中找第一个大于等于 target 的位置；若无则返回数组长度。','In a nondecreasing array find the first index with value >= target, or the array length.'],starter:`function solve({nums, target}) {\n  let left = 0, right = nums.length;\n  // TODO: 使用半开区间 [left, right)\n  return left;\n}`,tests:[[{nums:[1,2,2,2,5],target:2},1],[{nums:[1,4,9],target:6},2],[{nums:[],target:3},0],[{nums:[1,2],target:5},2]],hints:[['目标是找符合条件的第一个位置。','The goal is the first position satisfying a predicate.'],['判断 nums[mid] >= target 是否成立，以决定保留哪半边。','Check nums[mid] >= target to choose the half.'],['使用 [left,right) 时，满足条件可以让 right = mid。','For [left, right), set right = mid when the predicate holds.']]},
 {id:'fib',cat:'university',diff:'easy',name:['斐波那契数列','Fibonacci'],desc:['给定 0 <= n <= 30，返回第 n 个斐波那契数；F(0)=0，F(1)=1。','Given 0 <= n <= 30, return F(n) where F(0)=0, F(1)=1.'],starter:`function solve(n) {\n  // TODO: 用迭代或动态规划求解\n  return 0;\n}`,tests:[[0,0],[1,1],[2,1],[8,21],[10,55]],hints:[['写出 F(n) 与前两项的关系。','Express F(n) in terms of the two previous values.'],['能否只保存最近两项而非整张数组？','Can you store only the previous two values?'],['递推关系 F(n) = F(n-1) + F(n-2)，留意 n=0 和 1。','Use F(n)=F(n-1)+F(n-2); handle n=0 and n=1.']]}
];

export const langExamples={
 python:{
  bubble:`arr = list(input)
trace({'type':'array','values':arr[:]}, 'Start')
for i in range(len(arr)):
    for j in range(len(arr)-1-i):
        trace({'type':'array','values':arr[:],'focus':[j,j+1]}, 'Compare')
        if arr[j] > arr[j+1]:
            arr[j], arr[j+1] = arr[j+1], arr[j]
            trace({'type':'array','values':arr[:],'focus':[j,j+1]}, 'Swap')
trace({'type':'array','values':arr[:],'done':True}, 'Sorted')`,
  binary:`nums, target = input['nums'], input['target']
left, right = 0, len(nums)-1
while left <= right:
    mid = (left + right)//2
    trace({'type':'array','values':nums[:],'focus':[mid]}, f'Inspect index {mid}')
    if nums[mid] == target:
        break
    if nums[mid] < target: left = mid+1
    else: right = mid-1
trace({'type':'array','values':nums[:]}, 'Search ended')`
 },
 cpp:{
  bubble:`#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;
// The server will pass input as JSON. Emit one TRACE JSON object per line.
// This standalone example uses sample values; adapt JSON input in /api/execute.
int main() {
  vector<int> a={5,2,8,1,6,3};
  auto trace=[&](int x,int y){
    cout << "TRACE {\\"type\\":\\"array\\",\\"values\\":[";
    for(int k=0;k<(int)a.size();++k){if(k)cout<<",";cout<<a[k];}
    cout << "],\\"focus\\":[" << x << "," << y << "]}" << endl;
  };
  for(int i=0;i<(int)a.size();++i)
    for(int j=0;j+1<(int)a.size()-i;++j){
      trace(j,j+1);
      if(a[j]>a[j+1]){swap(a[j],a[j+1]);trace(j,j+1);}
    }
  return 0;
}`
 },
 c:{
  bubble:`#include <stdio.h>
int main(void) {
  int a[]={5,2,8,1,6,3},n=6;
  for(int i=0;i<n;i++) for(int j=0;j<n-1-i;j++){
    if(a[j]>a[j+1]){int t=a[j];a[j]=a[j+1];a[j+1]=t;}
    printf("TRACE {\\"type\\":\\"array\\",\\"values\\":[");
    for(int k=0;k<n;k++) printf("%s%d",k?",":"",a[k]);
    printf("],\\"focus\\":[%d,%d]}\\n",j,j+1);
  }
  return 0;
}`
 }
};
