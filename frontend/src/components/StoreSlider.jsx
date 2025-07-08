import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/autoplay";

const StoreSlider = ({ images }) => {
  const URL = import.meta.env.VITE_BACKEND_URL;

  return images?.length > 0 ? (
    <Swiper
      effect={"coverflow"}
      grabCursor={true}
      centeredSlides={true}
      initialSlide={1}
      slidesPerView={1}
      breakpoints={{
        640: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      }}
      pagination={{
        clickable: true,
        el: ".custom-pagination",
      }}
      autoplay={{
        delay: 8000,
        disableOnInteraction: false,
      }}
      modules={[EffectCoverflow, Pagination, Autoplay]}
      className="mb-44"
      coverflowEffect={{
        rotate: 0,
        stretch: 0,
        depth: 100,
        modifier: 1,
      }}
    >
      {images.map((image, i) => (
        <SwiperSlide
          className="rounded-[20px] overflow-hidden relative aspect-[16/9] pointer-events-auto"
          key={i}
        >
          <img
            src={URL + image}
            className="w-full h-full object-cover"
            alt="Slider Image"
          />
        </SwiperSlide>
      ))}
      <div className="custom-pagination text-center" />
    </Swiper>
  ) : null;
};

export default StoreSlider;
