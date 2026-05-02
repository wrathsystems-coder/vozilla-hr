type Props = {
  image_path: string;
  alt: string;
  caption?: string;
  credit?: string;
};

export function HeroImage({ image_path, alt, caption, credit }: Props) {
  return (
    <figure className="my-8">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image_path} alt={alt} className="w-full rounded-lg" />
      {(caption || credit) && (
        <figcaption className="mt-2 text-sm text-gray-600">
          {caption}
          {caption && credit && " — "}
          {credit && <span className="italic">{credit}</span>}
        </figcaption>
      )}
    </figure>
  );
}
