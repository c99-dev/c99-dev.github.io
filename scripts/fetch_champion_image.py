"""현재 데이터 버전의 챔피언 이미지를 다운로드하고 PNG 형식을 검증합니다."""
from concurrent.futures import ThreadPoolExecutor
import json

from data_common import PUBLIC, get


def fetch_champion_images(output_dir=PUBLIC):
    metadata = json.loads((output_dir / "json/version.json").read_text(encoding="utf-8"))
    champions = json.loads((output_dir / "json/championData.json").read_text(encoding="utf-8"))
    version = metadata["version"]
    image_dir = output_dir / "image/champion"
    image_dir.mkdir(parents=True, exist_ok=True)

    def download(champion):
        filename = champion["image"]["full"]
        response = get(f"https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{filename}")
        if not response.content.startswith(b"\x89PNG\r\n\x1a\n"):
            raise ValueError(f"PNG 이미지가 아닙니다: {filename}")
        image_path = image_dir / filename
        temporary = image_path.with_suffix(".tmp")
        temporary.write_bytes(response.content)
        temporary.replace(image_path)

    with ThreadPoolExecutor(max_workers=6) as executor:
        list(executor.map(download, champions["data"].values()))
    print(f"챔피언 이미지 검증 완료: {len(champions['data'])}개")


if __name__ == "__main__":
    fetch_champion_images()
