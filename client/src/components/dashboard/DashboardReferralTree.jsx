import { useState } from 'react';
import { ChevronDown, ChevronRight, GitBranch, Users } from 'lucide-react';

export default function DashboardReferralTree({ tree, loading, error }) {
  if (loading) {
    return (
      <div className="space-y-3" aria-label="Loading referral tree">
        <div className="h-16 animate-pulse rounded-xl bg-white/[0.035]" />
        <div className="ml-6 h-14 animate-pulse rounded-xl bg-white/[0.025]" />
      </div>
    );
  }

  if (error) {
    return <div role="alert" className="rounded-xl border border-rose-400/15 bg-rose-400/[0.06] px-4 py-3 text-sm text-rose-200">{error}</div>;
  }

  if (!tree) {
    return (
      <div className="flex min-h-36 flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.09] bg-white/[0.015] px-5 py-7 text-center">
        <GitBranch size={20} className="mb-2 text-slate-500" />
        <p className="text-sm font-medium text-slate-300">Referral network is empty</p>
        <p className="mt-1 text-xs text-slate-500">Your invited members will appear here.</p>
      </div>
    );
  }

  return <TreeNode node={tree} root />;
}

function TreeNode({ node, root = false, depth = 0 }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const children = Array.isArray(node.children) ? node.children : [];
  const name = node.fullName || 'Member';
  const status = String(node.accountStatus || 'active').toLowerCase();
  const nodeId = node._id || node.id || `${name}-${depth}`;

  return (
    <div className={root ? '' : 'relative ml-4 border-l border-white/[0.08] pl-3 sm:ml-6 sm:pl-5'}>
      {!root && <span className="absolute -left-px top-7 h-px w-3 bg-white/[0.08] sm:w-5" />}
      <div className={`flex min-w-0 items-center gap-2.5 rounded-xl border px-3 py-3 sm:gap-3 sm:px-4 ${
        root ? 'border-blue-300/15 bg-blue-400/[0.055]' : 'border-white/[0.06] bg-white/[0.02]'
      }`}>
        {children.length ? (
          <button
            type="button"
            className="grid h-7 w-7 flex-none place-items-center rounded-lg border border-white/[0.07] bg-black/10 text-slate-400 transition hover:text-white"
            onClick={() => setExpanded((current) => !current)}
            aria-label={`${expanded ? 'Collapse' : 'Expand'} ${name} referrals`}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="h-7 w-7 flex-none" aria-hidden="true" />
        )}
        <span className={`grid h-9 w-9 flex-none place-items-center rounded-lg ${
          root ? 'bg-blue-400/10 text-blue-200' : 'bg-white/[0.045] text-slate-400'
        }`}>
          <Users size={16} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-xs font-semibold text-slate-100">{name}</span>
            <span className="rounded-md border border-white/[0.07] px-1.5 py-0.5 text-[9px] text-slate-500">
              {root ? 'You' : `Level ${node.level ?? depth}`}
            </span>
          </span>
          <span className="mt-1 block truncate text-[10px] text-slate-500">{node.email || (children.length ? `${children.length} direct referral${children.length === 1 ? '' : 's'}` : 'No direct referrals')}</span>
        </span>
        <span className="flex flex-none items-center gap-1.5 text-[9px] font-medium capitalize text-slate-500">
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className="hidden sm:inline">{status}</span>
        </span>
      </div>
      {expanded && children.length > 0 && (
        <div className="mt-2.5 space-y-2.5">
          {children.map((child, index) => (
            <TreeNode key={child._id || child.id || `${nodeId}-${index}`} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
