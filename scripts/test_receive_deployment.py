"""배포 파일의 경로 제한과 운영 링크 복구를 검증합니다."""
import io
from pathlib import Path
import tarfile
from tempfile import TemporaryDirectory
import unittest

from receive_deployment import deploy, extract_archive


def archive(files, symlink=None):
    data = io.BytesIO()
    with tarfile.open(fileobj=data, mode='w:gz') as result:
        for name, content in files.items():
            info = tarfile.TarInfo(name)
            info.size = len(content)
            result.addfile(info, io.BytesIO(content))
        if symlink:
            info = tarfile.TarInfo(symlink)
            info.type = tarfile.SYMTYPE
            info.linkname = '/etc/passwd'
            result.addfile(info)
    data.seek(0)
    return data


def valid_files():
    return {
        'index.html': b'<link rel="canonical" href="https://aram.c99-dev.com/" />',
        'static/index-test.js': b'G-CRE7F98KB6',
        'robots.txt': b'User-agent: *\nDisallow:',
        'sitemap.xml': b'<urlset/>',
        'json/version.json': b'{}',
        'json/championData.json': b'{}',
        'json/championRanking.json': b'{}',
    }


class DeploymentTests(unittest.TestCase):
    def test_rejects_paths_outside_release(self):
        for name in ['../escape', '/absolute', 'folder/../../escape', r'folder\escape', '.env']:
            with self.subTest(name=name), TemporaryDirectory() as directory:
                with self.assertRaises(ValueError):
                    extract_archive(archive({name: b'bad'}), Path(directory))

    def test_rejects_symlinks(self):
        with TemporaryDirectory() as directory:
            with self.assertRaises(ValueError):
                extract_archive(archive({}, symlink='link'), Path(directory))

    def test_missing_ga_keeps_current_release(self):
        with TemporaryDirectory() as directory:
            base = Path(directory)
            (base / 'releases').mkdir()
            (base / 'current').write_text('기존 파일', encoding='utf-8')
            files = valid_files()
            files['static/index-test.js'] = b'missing-ga'
            with self.assertRaises(ValueError):
                deploy('a' * 40, archive(files), base, lambda revision: True)
            self.assertEqual((base / 'current').read_text(encoding='utf-8'), '기존 파일')
            self.assertEqual(list((base / 'releases').iterdir()), [])

    def test_failed_health_restores_previous_release(self):
        with TemporaryDirectory() as directory:
            base = Path(directory)
            previous = base / 'releases' / 'previous'
            previous.mkdir(parents=True)
            try:
                (base / 'current').symlink_to(previous, target_is_directory=True)
            except OSError:
                self.skipTest('이 환경에서는 심볼릭 링크 권한이 없습니다.')
            with self.assertRaises(RuntimeError):
                deploy('b' * 40, archive(valid_files()), base, lambda revision: False)
            self.assertEqual((base / 'current').resolve(), previous)

    def test_success_switches_release_and_records_commit(self):
        with TemporaryDirectory() as directory:
            base = Path(directory)
            (base / 'releases').mkdir()
            try:
                (base / 'probe').symlink_to(base / 'releases', target_is_directory=True)
            except OSError:
                self.skipTest('이 환경에서는 심볼릭 링크 권한이 없습니다.')
            release = deploy('c' * 40, archive(valid_files()), base, lambda revision: revision == 'c' * 40)
            self.assertEqual((base / 'current').resolve(), release)
            self.assertIn('c' * 40, (release / 'deployment.json').read_text())


if __name__ == '__main__':
    unittest.main()
