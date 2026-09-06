"""배포할 JSON과 챔피언 이미지의 일관성을 확인합니다."""
import json

from data_common import PUBLIC


def validate_data(public=PUBLIC):
    metadata = json.loads((public / "json/version.json").read_text(encoding="utf-8"))
    champions = json.loads((public / "json/championData.json").read_text(encoding="utf-8"))
    ranking = json.loads((public / "json/championRanking.json").read_text(encoding="utf-8"))
    if metadata["version"] != champions["version"]:
        raise ValueError("챔피언 데이터 버전이 일치하지 않습니다.")
    if len(champions["data"]) < 100 or len(ranking) < 100:
        raise ValueError("챔피언 또는 통계 데이터가 부족합니다.")
    missing_stats = []
    for champion in champions["data"].values():
        path = public / "image/champion" / champion["image"]["full"]
        if not path.read_bytes().startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValueError(f"챔피언 이미지가 올바르지 않습니다: {champion['id']}")
        if champion["name"] not in ranking:
            missing_stats.append(champion["name"])
    print(f"데이터 검증 완료: {metadata['version']}, 챔피언 {len(champions['data'])}명, 통계 {len(ranking)}명")
    if missing_stats:
        print(f"아직 통계가 없는 챔피언: {', '.join(missing_stats)}")


if __name__ == "__main__":
    validate_data()
