interface Props {
  className?: string;
  count?: number;
}

export default function Skeleton({ className = '', count = 1 }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton ${className}`} />
      ))}
    </>
  );
}