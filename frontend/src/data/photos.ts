export interface Photo {
  id: string
  src: string
  alt: string
}

export const photos: Photo[] = [
  { id: '01', src: '/photos/house-01.jpg', alt: 'Двухэтажный кирпичный коттедж с каменными акцентами' },
  { id: '02', src: '/photos/house-02.jpg', alt: 'Коттедж с металлической кровлей и гаражом' },
  { id: '03', src: '/photos/house-03.jpg', alt: 'Загородный дом в процессе отделки фасада' },
  { id: '04', src: '/photos/house-04.jpg', alt: 'Кирпичный коттедж с панорамными окнами' },
  { id: '05', src: '/photos/house-05.jpg', alt: 'Строительство коттеджа — вид с участка' },
  { id: '06', src: '/photos/house-06.jpg', alt: 'Готовый загородный дом — общий вид' },
  { id: '07', src: '/photos/house-07.jpg', alt: 'Коттедж с террасой и ландшафтом' },
]
