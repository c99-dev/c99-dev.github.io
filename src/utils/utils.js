// 배열을 랜덤하게 셔플하는 함수
export const sortChampions = (champions, sortOption, ranking = {}) => {
  if (sortOption === 'random') return champions;
  return [...champions].sort((a, b) =>
    sortOption === 'alphabetical'
      ? a.name.localeCompare(b.name, 'ko')
      : (ranking[a.name]?.ranking ?? 999) - (ranking[b.name]?.ranking ?? 999),
  );
};

export const shuffleArray = array => {
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
