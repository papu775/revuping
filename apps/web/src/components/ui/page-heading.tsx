export function PageHeading({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading mb-7 flex flex-wrap items-end justify-between gap-5 max-md:items-start">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-1px] max-md:text-[28px]">
          {title}
        </h1>
        <p className="mt-2 max-w-[620px] text-[15px] leading-7 text-muted">
          {text}
        </p>
      </div>
      {children}
    </div>
  );
}
