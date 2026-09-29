#!/usr/bin/python3
"""제한된 SSH 배포 계정으로 파일을 받아 검사 후 운영 링크를 교체합니다."""
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile
import urllib.request

BASE = Path('/srv/aram-random-pick')
MAX_ARCHIVE = 64 * 1024 * 1024
MAX_CONTENT = 200 * 1024 * 1024


def extract_archive(source, destination):
    compressed = source.read(MAX_ARCHIVE + 1)
    if len(compressed) > MAX_ARCHIVE:
        raise ValueError('압축 파일 크기 제한을 초과했습니다.')
    total = count = 0
    with tarfile.open(fileobj=io.BytesIO(compressed), mode='r:gz') as archive:
        for member in archive:
            path = PurePosixPath(member.name)
            if path.is_absolute() or '..' in path.parts or '\\' in member.name:
                raise ValueError('허용되지 않는 파일 경로입니다.')
            if any(part.startswith('.') for part in path.parts):
                raise ValueError('숨김 파일은 배포할 수 없습니다.')
            if not (member.isdir() or member.isfile()):
                raise ValueError('일반 파일과 디렉터리만 배포할 수 있습니다.')
            count += 1
            total += member.size
            if count > 10000 or total > MAX_CONTENT:
                raise ValueError('압축 해제 크기 제한을 초과했습니다.')
            target = destination.joinpath(*path.parts)
            if member.isdir():
                target.mkdir(parents=True, exist_ok=True, mode=0o755)
            else:
                target.parent.mkdir(parents=True, exist_ok=True, mode=0o755)
                with archive.extractfile(member) as data, target.open('xb') as output:
                    shutil.copyfileobj(data, output)
                target.chmod(0o644)


def validate_release(release):
    html = (release / 'index.html').read_text(encoding='utf-8')
    if '<link rel="canonical" href="https://aram.c99-dev.com/"' not in html:
        raise ValueError('대표 주소가 올바르지 않습니다.')
    bundles = list((release / 'static').glob('*.js'))
    if not any('G-CRE7F98KB6' in path.read_text(encoding='utf-8') for path in bundles):
        raise ValueError('기존 GA4 설정을 포함하지 않은 빌드입니다.')
    for resource in ['robots.txt', 'sitemap.xml', 'json/version.json', 'json/championData.json', 'json/championRanking.json']:
        if not (release / resource).is_file():
            raise ValueError(f'필수 파일이 없습니다: {resource}')


def check_health(revision):
    request = urllib.request.Request('http://127.0.0.1:8088/deployment.json', headers={'Host': 'aram.c99-dev.com'})
    with urllib.request.urlopen(request, timeout=10) as response:
        return json.load(response).get('commit') == revision


def switch_release(base, target):
    temporary = base / '.current-next'
    temporary.unlink(missing_ok=True)
    temporary.symlink_to(target, target_is_directory=True)
    temporary.replace(base / 'current')


def deploy(revision, source, base=BASE, health=check_health):
    if not re.fullmatch(r'[0-9a-f]{40}', revision):
        raise ValueError('커밋 SHA 형식이 잘못되었습니다.')
    release = Path(tempfile.mkdtemp(prefix=f'{revision[:12]}-', dir=base / 'releases'))
    release.chmod(0o755)
    try:
        extract_archive(source, release)
        validate_release(release)
        (release / 'deployment.json').write_text(json.dumps({'commit': revision}) + '\n', encoding='utf-8')
        (release / 'deployment.json').chmod(0o644)
    except Exception:
        shutil.rmtree(release)
        raise
    current = base / 'current'
    previous = current.readlink() if current.is_symlink() else None
    switch_release(base, release)
    try:
        if not health(revision):
            raise RuntimeError('운영 응답의 커밋이 다릅니다.')
    except Exception:
        if previous is not None:
            switch_release(base, previous)
        else:
            current.unlink()
        raise RuntimeError('운영 응답 확인 실패: 이전 배포로 복구했습니다.') from None
    return release


def main():
    # forced command에서 인수나 셸 구문을 실행하지 않습니다.
    command = os.environ.get('SSH_ORIGINAL_COMMAND', '')
    match = re.fullmatch(r'deploy ([0-9a-f]{40})', command)
    if not match:
        raise ValueError('허용되지 않는 SSH 명령입니다.')
    import fcntl
    os.umask(0o022)
    with (BASE / '.deploy.lock').open('w') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        deploy(match[1], sys.stdin.buffer)
    print(f'배포 완료: {match[1]}')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print(f'배포 실패: {error}', file=sys.stderr)
        sys.exit(1)
