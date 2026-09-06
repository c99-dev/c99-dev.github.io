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
