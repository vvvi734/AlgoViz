"""
中文导读：倒排索引把“记录含哪些词”翻转为“每个词对应哪些记录 ID”。
构建阶段逐记录追加 ID；查询阶段读取多张倒排表，AND 求交、OR 求并，
最后按原记录顺序过滤。缺失词得到空表，不是错误。
易错点：一个关键字可对应多条记录；AND 只读第一张表；OR 不去重；把倒排表当唯一键索引。
复杂度：构建 O(T)，查询 O(Σ|L|)。输入关键字已经分好词，不做中文分词或全文搜索。
输入/输出：R1–R4，构建后演示“algorithms AND sorting”与“algorithms OR sorting”。
"""

from dataclasses import dataclass, field


@dataclass
class Record:
    record_id: str
    keywords: list[str] = field(default_factory=list)


def build_index(records: list[Record]) -> dict[str, list[str]]:
    """作用：逐记录、逐关键字把记录 ID 追加到对应倒排表。"""
    index: dict[str, list[str]] = {}
    # setdefault creates a posting list on first sight, so build order does not need a separate term table.
    for record in records:
        for term in record.keywords:
            index.setdefault(term, []).append(record.record_id)
    return index


def query(records: list[Record], index: dict[str, list[str]],
          terms: list[str], mode: str) -> list[str]:
    """作用：按原记录顺序做 AND 交集或 OR 并集，同一条记录只返回一次。"""
    matched: list[str] = []
    # Walk records, not posting lists, so AND and OR both keep storage order and return each record at most once.
    for record in records:
        if mode == "and":
            include = all(record.record_id in index.get(term, [])
                          for term in terms)
        else:
            include = any(record.record_id in index.get(term, [])
                          for term in terms)
        if include:
            matched.append(record.record_id)
    return matched


def main() -> None:
    records = [
        Record("R1", ["data structures", "algorithms"]),
        Record("R2", ["algorithms", "sorting"]),
        Record("R3", ["data structures", "sorting"]),
        Record("R4", ["index", "algorithms"]),
    ]
    index = build_index(records)
    print("inverted index:")
    for term, postings in index.items():
        print(f"  {term} -> {' '.join(postings)}")
    print("algorithms AND sorting:", " ".join(query(records, index, ["algorithms", "sorting"], "and")))
    print("algorithms OR sorting:", " ".join(query(records, index, ["algorithms", "sorting"], "or")))
    # A missing term falls back to an empty list: AND with it must fail, while OR can still match another term.
    print("missing term AND algorithms:", query(records, index, ["missing", "algorithms"], "and"))


if __name__ == "__main__":
    main()


