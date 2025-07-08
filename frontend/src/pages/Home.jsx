import HomeSlider from "../components/HomeSlider";
import Shops from "../components/Shops";

const Home = ({ t }) => {
  return (
    <section className="content__wrapper">
      <div className="content">
        <HomeSlider />

        <Shops t={t} />
      </div>
    </section>
  );
};
export default Home;
