"""네트워크 없이 갱신 실패와 통계 참조 복원을 검증합니다."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

import update_data
from fetch_ranking_data import parse_ranking


class UpdateTests(unittest.TestCase):
    def test_failed_download_preserves_existing_files(self):
        with TemporaryDirectory() as directory:
            public = Path(directory)
            original = public / "json/version.json"
            original.parent.mkdir()
            original.write_text('{"version":"old"}', encoding="utf-8")
            with patch.object(update_data, "PUBLIC", public), \
                 patch.object(update_data, "fetch_champion_data"), \
                 patch.object(update_data, "fetch_ranking_data"), \
                 patch.object(update_data, "fetch_champion_images", side_effect=RuntimeError("다운로드 실패")):
                with self.assertRaises(RuntimeError):
                    update_data.update_data()
            self.assertEqual(original.read_text(encoding="utf-8"), '{"version":"old"}')

    def test_ranking_resolves_nested_duo_references(self):
        raw = [{"tierlist": 1}, []]
        def add(value):
            raw.append(value)
            return len(raw) - 1
        for number in range(100):
            stats = {key: add(value) for key, value in {
                "ranking": number + 1, "pickRate": "1.2", "count": 100,
                "winRate": "51.2", "opTier": 2, "isHoney": False, "isOp": False,
            }.items()}
            stats["championInfo"] = add({"nameKr": add(f"챔피언{number}")})
            stats["duoChampionIds"] = add([add(22), add(99)])
            raw[1].append(add(stats))
        parsed = parse_ranking({"nodes": [None, {"data": raw}]})
        self.assertEqual(len(parsed), 100)
        self.assertEqual(parsed["챔피언0"]["duoChampionIds"], [22, 99])

    def test_empty_statistics_rejected(self):
        with self.assertRaises(ValueError):
            parse_ranking({"nodes": [{"data": [{"tierlist": 1}, []]}]})


if __name__ == "__main__":
    unittest.main()
