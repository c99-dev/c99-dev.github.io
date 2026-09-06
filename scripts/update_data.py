"""모든 다운로드가 성공한 뒤 검증된 파일만 public에 반영합니다."""
from pathlib import Path
from tempfile import TemporaryDirectory
import shutil

from data_common import PUBLIC
from fetch_champion_data import fetch_champion_data
from fetch_champion_image import fetch_champion_images
from fetch_ranking_data import fetch_ranking_data
from validate_data import validate_data


def update_data():
    with TemporaryDirectory(prefix="aram-data-") as temporary:
        staging = Path(temporary)
        fetch_champion_data(staging)
        fetch_ranking_data(staging)
        fetch_champion_images(staging)
        validate_data(staging)
        files = sorted(path for path in staging.rglob("*") if path.is_file())
        # 버전 파일을 마지막에 반영합니다. 네트워크 오류는 이 단계 이전에 종료됩니다.
        files.sort(key=lambda path: path.name == "version.json")
        for source in files:
            destination = PUBLIC / source.relative_to(staging)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, destination)
    print("데이터 및 이미지 갱신이 완료되었습니다.")


if __name__ == "__main__":
    update_data()
