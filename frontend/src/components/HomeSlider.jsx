import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Autoplay } from "swiper/modules";
import logo from "/web-images/logo.svg";
import { useSelector } from "react-redux";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/autoplay";

const HomeSlider = () => {
  const URL = import.meta.env.VITE_BACKEND_URL;
  const overview = useSelector((state) => state.overview.overview);

  return (
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
      {overview &&
        overview.map((item) => {
          return (
            <SwiperSlide
              className="rounded-[20px] overflow-hidden relative aspect-[16/9] pointer-events-auto"
              key={item.id}
            >
              <a href={item.paymentUrl} target="_blank">
                <img
                  src={URL + item.imagePath}
                  className="w-full h-full object-cover"
                  alt="Slider Image"
                />
                <div className="absolute bottom-0 bg-black w-full h-[20%] flex items-center px-4 gap-5">
                  <img src={logo} alt="" className="max-w-[30px]" />
                  <p>{item.text}</p>
                </div>
              </a>
            </SwiperSlide>
          );
        })}
      <div className="custom-pagination text-center" />
    </Swiper>
  );
};

export default HomeSlider;
