"""lol.ps에서 공개된 ARAM 통계를 가져옵니다."""
from datetime import datetime, timezone
import json

from data_common import PUBLIC, get, write_json

SOURCE = "https://lol.ps/aram-statistics/__data.json"


def parse_ranking(payload):
    raw = next(node["data"] for node in payload["nodes"]
               if isinstance(node, dict) and isinstance(node.get("data"), list)
               and node["data"] and isinstance(node["data"][0], dict)
               and "tierlist" in node["data"][0])
    statistics = {}
    for index in raw[raw[0]["tierlist"]]:
        entry = raw[index]
        info = raw[entry["championInfo"]]
        name = raw[info["nameKr"]]
        stats = {key: raw[entry[key]] for key in
                 ("ranking", "pickRate", "count", "winRate", "opTier", "isHoney", "isOp")}
        # Svelte 데이터 배열 안의 참조를 실제 챔피언 ID로 복원합니다.
        stats["duoChampionIds"] = [raw[value] for value in raw[entry["duoChampionIds"]]] if "duoChampionIds" in entry else []
        if not 0 <= float(stats["winRate"]) <= 100 or not 1 <= stats["opTier"] <= 5:
            raise ValueError(f"통계 값이 올바르지 않습니다: {name}")
        statistics[name] = stats
    if len(statistics) < 100:
        raise ValueError("통계가 너무 적습니다. 원본 데이터 구조를 확인해주세요.")
    return statistics


def fetch_ranking_data(output_dir=PUBLIC):
    statistics = parse_ranking(get(SOURCE).json())
    write_json(output_dir / "json/championRanking.json", statistics)
    version_path = output_dir / "json/version.json"
    if version_path.exists():
        metadata = json.loads(version_path.read_text(encoding="utf-8"))
        metadata.update({
            "rankingSource": "https://lol.ps/aram-statistics/",
            "rankingFetchedAt": datetime.now(timezone.utc).isoformat(),
        })
        write_json(version_path, metadata)
    print(f"공개 ARAM 통계 갱신: {len(statistics)}명 (통계 집계 패치는 제공처 기준)")
    return statistics


if __name__ == "__main__":
    fetch_ranking_data()
