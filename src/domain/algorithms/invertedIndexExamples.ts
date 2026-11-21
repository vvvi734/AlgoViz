/**
 * TEXTBOOK-12: real Python execution for inverted-index construction and query.
 *
 * Records already carry segmented keywords; no tokenizer is invented. Building
 * scans one record at a time and appends its id to every term's posting list.
 * Querying reads one posting list per term and applies ordered set intersection
 * (AND) or union (OR), so final ids always refer to the original records.
 */
import type { AlgorithmEntry } from './types';

export const INVERTED_INDEX_ENTRY: AlgorithmEntry = {
  group: 'search',
  icon: '⌕',
  name: ['倒排索引构建与查询', 'Inverted-index build and query'],
  desc: [
    '倒排索引把“记录包含哪些关键字”反转成“每个关键字出现在哪些记录”。构建时逐条扫描记录并追加记录 ID；查询时读取各关键字的倒排列表，执行 AND 交集或 OR 并集并返回原记录。',
    'An inverted index reverses “which keywords does a record contain?” into “which records contain each keyword?” Construction scans records and appends ids; a query reads posting lists and applies AND intersection or OR union before returning original records.',
  ],
  time: 'Build O(total keywords); query O(sum of posting lengths + output)',
  space: 'O(total postings) for the inverted lists',
  input: undefined,
  code: "trace({type:'array',values:['inverted index: run the Python preset'],done:true},'请在 Python 模式运行 / Run the Python preset');",
};

export const INVERTED_INDEX_DEFAULT_INPUT: unknown = {
  preset: 'and-query',
  mode: 'and',
  queryTerms: ['算法', '排序'],
  records: [
    { id: 'R1', keywords: ['数据结构', '算法'] },
    { id: 'R2', keywords: ['算法', '排序'] },
    { id: 'R3', keywords: ['数据结构', '排序'] },
    { id: 'R4', keywords: ['索引', '算法'] },
  ],
};

export const INVERTED_INDEX_PYTHON = `# Inverted-index construction and set query. Keywords are already segmented by
# the input; this program does not implement a tokenizer. Posting lists contain
# record ids, and query results are computed by real AND intersection or OR union.
import inspect


def _read_input(raw):
    if not isinstance(raw, dict):
        raise ValueError("inverted-index input must be an object")
    rows = raw.get("records")
    if not isinstance(rows, list) or not 2 <= len(rows) <= 9:
        raise ValueError("provide 2 to 9 records")
    records = []
    ids = set()
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("each record must be an object")
        record_id = row.get("id")
        if not isinstance(record_id, str) or len(record_id) < 2 or record_id[0] != "R" or not record_id[1:].isdigit():
            raise ValueError("record ids must look like R1, R2, ...")
        if record_id in ids:
            raise ValueError("record ids must be unique")
        ids.add(record_id)
        keywords = row.get("keywords")
        if not isinstance(keywords, list) or not 1 <= len(keywords) <= 4:
            raise ValueError("each record needs 1 to 4 keywords")
        clean = []
        for keyword in keywords:
            if not isinstance(keyword, str) or not 1 <= len(keyword.strip()) <= 16:
                raise ValueError("keywords must contain 1 to 16 characters")
            keyword = keyword.strip()
            if keyword in clean:
                raise ValueError("keywords inside a record must be unique")
            clean.append(keyword)
        records.append({"id": record_id, "keywords": clean})
    terms = raw.get("queryTerms")
    if not isinstance(terms, list) or not 1 <= len(terms) <= 4:
        raise ValueError("provide 1 to 4 query terms")
    query = []
    for term in terms:
        if not isinstance(term, str) or not 1 <= len(term.strip()) <= 16:
            raise ValueError("query terms must contain 1 to 16 characters")
        term = term.strip()
        if term in query:
            raise ValueError("query terms must be unique")
        query.append(term)
    mode = raw.get("mode", "and")
    if mode not in ("and", "or"):
        raise ValueError("mode must be and or or")
    preset = raw.get("preset")
    if preset is not None and not isinstance(preset, str):
        preset = None
    return records, query, mode, preset


RAW_RECORDS, QUERY_TERMS, MODE, PRESET = _read_input(input)
RECORDS = [{"id": record["id"], "keywords": list(record["keywords"])} for record in RAW_RECORDS]
BUILT = 0
CURRENT_RECORD = None
CURRENT_KEYWORD = None
CURRENT_TERM = None
TERM_POSTINGS = []
MATCHED = []
TRACING = True


def emit(operation, message, lesson, result=None):
    if not TRACING:
        return
    trace(
        {"type": "array", "values": [record["id"] for record in RECORDS], "done": operation == "done"},
        message,
        line=inspect.currentframe().f_back.f_lineno,
        variables={
            "mode": MODE,
            "records": len(RECORDS),
            "terms": len(INDEX),
            "builtCount": BUILT,
            "queryTerms": list(QUERY_TERMS),
            "matchedCount": len(MATCHED),
            "result": result if result is not None else "pending",
        },
        lesson_step=lesson,
        structure={
            "kind": "inverted-index",
            "preset": PRESET,
            "operation": operation,
            "mode": MODE,
            "records": [{"id": record["id"], "keywords": list(record["keywords"])} for record in RECORDS],
            "index": [{"term": entry["term"], "postings": list(entry["postings"])} for entry in INDEX],
            "builtCount": BUILT,
            "currentRecordId": CURRENT_RECORD,
            "currentKeyword": CURRENT_KEYWORD,
            "queryTerms": list(QUERY_TERMS),
            "currentTerm": CURRENT_TERM,
            "termPostings": list(TERM_POSTINGS),
            "matchedIds": list(MATCHED),
            "result": result,
        },
    )


TERMS = sorted({keyword for record in RECORDS for keyword in record["keywords"]})
INDEX = [{"term": term, "postings": []} for term in TERMS]
BY_TERM = {entry["term"]: entry for entry in INDEX}
emit(
    "init",
    "为全部关键字建立空倒排表 / create one empty posting list per term",
    "init",
)

for position, record in enumerate(RECORDS):
    BUILT = position + 1
    CURRENT_RECORD = record["id"]
    CURRENT_KEYWORD = None
    emit(
        "scan-record",
        "扫描记录 " + record["id"] + "，读取已分好的关键字 / scan the record’s segmented keywords",
        "scan-record",
    )
    for keyword in record["keywords"]:
        CURRENT_KEYWORD = keyword
        BY_TERM[keyword]["postings"].append(record["id"])
        emit(
            "term-add",
            "把 " + record["id"] + " 追加到“" + keyword + "”的倒排列表 / append the record id to the posting list",
            "term-add",
        )

CURRENT_RECORD = None
CURRENT_KEYWORD = None
emit(
    "build-done",
    "全部记录扫描完毕，倒排索引构建完成 / the inverted index is complete",
    "build-done",
)

running = None
for term in QUERY_TERMS:
    CURRENT_TERM = term
    entry = BY_TERM.get(term)
    TERM_POSTINGS = list(entry["postings"]) if entry is not None else []
    emit(
        "query-term",
        "读取关键字“" + term + "”的倒排列表 / read the posting list",
        "query-term",
    )
    if running is None:
        running = list(TERM_POSTINGS)
    elif MODE == "and":
        running = [record["id"] for record in RECORDS
                   if record["id"] in running and record["id"] in TERM_POSTINGS]
    else:
        running = [record["id"] for record in RECORDS
                   if record["id"] in running or record["id"] in TERM_POSTINGS]
    MATCHED = list(running)
    emit(
        "combine",
        ("求交集" if MODE == "and" else "求并集") + "：累计结果 " + str(MATCHED) + " / apply the set operation",
        "combine",
    )

CURRENT_TERM = None
TERM_POSTINGS = []
emit(
    "done",
    "查询结束，返回 " + str(len(MATCHED)) + " 条原记录 / query complete with original record ids",
    "done",
    result="matched" if MATCHED else "empty",
)
`;

export const INVERTED_INDEX_RANDOM_SCENARIOS = [
  { id: 'and-query', label: ['AND 交集', 'AND intersection'] },
  { id: 'or-query', label: ['OR 并集', 'OR union'] },
  { id: 'no-match', label: ['无匹配', 'No matches'] },
  { id: 'shared-keyword', label: ['共享关键字', 'Shared keyword'] },
  { id: 'missing-term', label: ['缺失关键字', 'Missing term'] },
] as const;
