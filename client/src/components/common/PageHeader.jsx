export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-7 flex flex-col gap-4 border-b border-white/[0.06] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-300/85">NexaChain workspace</p>
        <h2 className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-white md:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-slate-400">{subtitle}</p>}
      </div>
      {action ? <div className="self-start md:self-auto">{action}</div> : null}
    </div>
  );
}
