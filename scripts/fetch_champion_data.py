"""한국 서버의 현재 챔피언 데이터와 Data Dragon 버전을 갱신합니다."""
from data_common import PUBLIC, get, write_json


def fetch_champion_data(output_dir=PUBLIC):
    version = get("https://ddragon.leagueoflegends.com/realms/kr.json").json()["n"]["champion"]
    data = get(f"https://ddragon.leagueoflegends.com/cdn/{version}/data/ko_KR/champion.json").json()
    if data.get("version") != version or len(data.get("data", {})) < 100:
        raise ValueError("챔피언 데이터가 비어 있거나 버전이 일치하지 않습니다.")
    write_json(output_dir / "json/championData.json", data)
    # 2026 시즌의 게임 패치 표기는 26.x, Data Dragon은 16.x를 사용합니다.
    major, minor, *_ = version.split(".")
    patch = f"{int(major) + 10}.{minor}" if int(major) >= 15 else f"{major}.{minor}"
    write_json(output_dir / "json/version.json", {"version": version, "patch": patch})
    print(f"챔피언 데이터 갱신: 패치 {patch}, Data Dragon {version}, {len(data['data'])}명")


if __name__ == "__main__":
    fetch_champion_data()
