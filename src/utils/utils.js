// 배열을 랜덤하게 셔플하는 함수
export const shuffleArray = (array) => {
  const arrCopy = [...array];
  let currentIndex = arrCopy.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arrCopy[currentIndex], arrCopy[randomIndex]] = [
      arrCopy[randomIndex],
      arrCopy[currentIndex],
    ];
  }
  return arrCopy;
};

// 화면과 텍스트 복사에서 동일한 정렬을 사용합니다.
export const sortChampions = (champions, sortOption, ranking = {}) => {
  if (sortOption === 'random') return [...champions];
  return [...champions].sort(sortOption === 'alphabetical'
    ? (a, b) => a.name.localeCompare(b.name)
    : (a, b) => (ranking[a.name]?.ranking || 999) - (ranking[b.name]?.ranking || 999));
};
