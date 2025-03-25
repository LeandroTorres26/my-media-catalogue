export default function MediaDetailsSection({
  open,
  onToggle,
  generatePrompt,
  promptLoading,
  promptError,
  genres,
  onGenreKeyDown,
  onRemoveGenre,
  plot,
  releaseYear,
  rating,
  category,
  season,
  episode,
}: {
  open: boolean;
  onToggle: () => void;
  generatePrompt: (targetInput: string) => void;
  promptLoading: boolean;
  promptError: string | null;
  genres: string[];
  onGenreKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onRemoveGenre: (index: number) => void;
  plot?: string;
  releaseYear?: number;
  rating?: number;
  category: string;
  season?: number;
  episode?: number;
}) {
  return (
    <fieldset className="bg-base-200 my-4 grid content-start items-start rounded-md">
      <legend
        className="bg-base-300 flex w-full cursor-pointer items-center justify-between rounded-md px-4 py-2 text-center text-lg"
        onClick={onToggle}
      >
        Media Details
        <svg
          xmlns="http://www.w3.org/2000/svg"
          id="Bold"
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="currentColor"
        >
          <path d="M1.51,6.079a1.492,1.492,0,0,1,1.06.44l7.673,7.672a2.5,2.5,0,0,0,3.536,0L21.44,6.529A1.5,1.5,0,1,1,23.561,8.65L15.9,16.312a5.505,5.505,0,0,1-7.778,0L.449,8.64A1.5,1.5,0,0,1,1.51,6.079Z" />
        </svg>
      </legend>
      <div
        className={`grid grid-cols-2 gap-6 overflow-hidden px-4 transition-all duration-1000 ease-in-out ${open ? "max-h-[999px] py-6" : "max-h-0"}`}
      >
        {promptError && (
          <p className="text-error col-span-2 text-center">{promptError}</p>
        )}
        <div className="col-span-2 flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <label htmlFor="genres">Genres</label>
            <AiGeneratorButton
              targetInput="genres"
              generatePrompt={generatePrompt}
              promptLoading={promptLoading}
            />
          </div>
          <input
            type="text"
            name="genres"
            placeholder=""
            className="input w-full"
            onKeyDown={onGenreKeyDown}
          />
          {genres.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {genres.map((genre, index) => (
                <li
                  key={index}
                  onClick={() => onRemoveGenre(index)}
                  className="cursor-pointer rounded-full border px-2 py-1 capitalize hover:border-red-500 hover:text-red-500"
                >
                  {genre}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="col-span-2 row-span-2 grid grid-rows-subgrid gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="plot">Synopsis</label>
            <AiGeneratorButton
              targetInput="plot"
              generatePrompt={generatePrompt}
              promptLoading={promptLoading}
            />
          </div>
          <textarea
            name="plot"
            className="textarea min-h-40 w-full"
            defaultValue={plot}
          />
        </div>
        <div className="col-span-2 row-span-2 grid grid-rows-subgrid gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="release_date">Release Year</label>
            <AiGeneratorButton
              targetInput="release_date"
              generatePrompt={generatePrompt}
              promptLoading={promptLoading}
            />
          </div>
          <input
            type="number"
            name="release_date"
            min={1900}
            max={new Date().getFullYear()}
            defaultValue={releaseYear}
            className="input w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="rating">Rating</label>
          <div className="rating rating-lg rating-half">
            <input
              type="radio"
              name="rating"
              className="rating-hidden"
              defaultChecked={rating === 0}
              value={0}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-1 bg-primary"
              aria-label="0.5 star"
              defaultChecked={rating === 1}
              value={1}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-2 bg-primary"
              aria-label="1 star"
              defaultChecked={rating === 2}
              value={2}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-1 bg-primary"
              aria-label="1.5 star"
              defaultChecked={rating === 3}
              value={3}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-2 bg-primary"
              aria-label="2 star"
              defaultChecked={rating === 4}
              value={4}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-1 bg-primary"
              aria-label="2.5 star"
              defaultChecked={rating === 5}
              value={5}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-2 bg-primary"
              aria-label="3 star"
              defaultChecked={rating === 6}
              value={6}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-1 bg-primary"
              aria-label="3.5 star"
              defaultChecked={rating === 7}
              value={7}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-2 bg-primary"
              aria-label="4 star"
              defaultChecked={rating === 8}
              value={8}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-1 bg-primary"
              aria-label="4.5 star"
              defaultChecked={rating === 9}
              value={9}
            />
            <input
              type="radio"
              name="rating"
              className="mask mask-star-2 mask-half-2 bg-primary"
              aria-label="5 star"
              defaultChecked={rating === 10}
              value={10}
            />
          </div>
        </div>
        {category !== "movie" && (
          <>
            <div className="row-span-2 grid grid-rows-subgrid gap-2">
              <label htmlFor="season">Season</label>
              <input
                type="number"
                name="season"
                defaultValue={season}
                className="input w-full"
              />
            </div>
            <div className="row-span-2 grid grid-rows-subgrid gap-2">
              <label htmlFor="episode">Episode</label>
              <input
                type="number"
                name="episode"
                defaultValue={episode}
                className="input w-full"
              />
            </div>
          </>
        )}
      </div>
    </fieldset>
  );
}

const AiGeneratorButton = ({
  targetInput,
  generatePrompt,
  promptLoading,
}: {
  targetInput: string;
  generatePrompt: (inpurtName: string) => void;
  promptLoading: boolean;
}) => (
  <button
    onClick={(e) => {
      e.preventDefault();
      generatePrompt(targetInput);
    }}
    className={`btn btn-secondary btn-xs flex gap-1`}
    disabled={promptLoading}
  >
    {promptLoading ? (
      <span className="loading loading-spinner loading-xs"></span>
    ) : (
      <>
        <svg
          width="20"
          height="20"
          viewBox="0 0 102 78"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_41_13)">
            <path d="M87.0435 61.5528C83.016 61.7999 79.2178 63.5113 76.3646 66.3646C73.5113 69.2178 71.7999 73.016 71.5528 77.0435H71.4907C71.2439 73.0158 69.5327 69.2175 66.6793 66.3641C63.826 63.5108 60.0277 61.7995 56 61.5528V61.4907C60.0277 61.2439 63.826 59.5327 66.6793 56.6793C69.5327 53.826 71.2439 50.0277 71.4907 46H71.5528C71.7999 50.0275 73.5113 53.8256 76.3646 56.6789C79.2178 59.5321 83.016 61.2435 87.0435 61.4907V61.5528Z" />
          </g>
          <g clipPath="url(#clip1_41_13)">
            <path d="M70.9565 40.4188C61.7508 40.9838 53.0693 44.8956 46.5476 51.4173C40.0259 57.939 36.1142 66.6204 35.5492 75.8261H35.4073C34.8433 66.6201 30.9318 57.9381 24.4099 51.4162C17.8881 44.8943 9.20609 40.9828 0 40.4188L0 40.2769C9.20609 39.7129 17.8881 35.8015 24.4099 29.2796C30.9318 22.7577 34.8433 14.0757 35.4073 4.86963L35.5492 4.86963C36.1142 14.0754 40.0259 22.7568 46.5476 29.2785C53.0693 35.8002 61.7508 39.712 70.9565 40.2769V40.4188Z" />
          </g>
          <g clipPath="url(#clip2_41_13)">
            <path d="M101.783 24.4401C95.4536 24.8285 89.4852 27.5178 85.0015 32.0015C80.5178 36.4852 77.8285 42.4536 77.4401 48.7826H77.3425C76.9548 42.4534 74.2656 36.4846 69.7818 32.0008C65.298 27.517 59.3292 24.8278 53 24.4401V24.3425C59.3292 23.9548 65.298 21.2656 69.7818 16.7818C74.2656 12.298 76.9548 6.32918 77.3425 0L77.4401 0C77.8285 6.32896 80.5178 12.2974 85.0015 16.7811C89.4852 21.2648 95.4536 23.9541 101.783 24.3425V24.4401Z" />
          </g>
        </svg>
        Generate
      </>
    )}
  </button>
);
