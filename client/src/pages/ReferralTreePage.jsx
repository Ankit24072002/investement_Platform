import { useEffect, useState } from 'react';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import api from '../services/api';
import PageHeader from '../components/common/PageHeader';
import SectionCard from '../components/common/SectionCard';

export default function ReferralTreePage() {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/referrals/tree');
        setTree(data?.data?.tree || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load referral tree.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <div className="h-48 animate-pulse rounded-3xl bg-slate-900/60" />;

  return (
    <div>
      <PageHeader title="Referral tree" subtitle="Visualize your referral hierarchy." />
      <SectionCard title="Network" subtitle="Nested direct referral relationships">
        {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {tree ? <TreeNode node={tree} /> : <div className="text-slate-400">No referral tree available.</div>}
      </SectionCard>
    </div>
  );
}

function TreeNode({ node, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const childCount = node.children?.length || 0;

  return (
    <div className="ml-4 border-l border-slate-700 pl-5">
      <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen((prev) => !prev)} className="rounded-lg border border-slate-700 p-1 text-slate-300">
            {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
            <Users size={18} />
          </div>
          <div>
            <div className="font-medium text-white">{node.fullName || 'User'}</div>
            <div className="text-xs text-slate-400">Level {node.level ?? 0}</div>
          </div>
        </div>
        <div className="text-right text-xs text-slate-300">
          <div>{childCount} direct referrals</div>
          <div className="mt-1 text-slate-500">{node.accountStatus || 'active'}</div>
        </div>
      </div>

      {open && node.children?.length > 0 && (
        <div className="mt-3 space-y-3">
          {node.children.map((child) => (
            <TreeNode key={child._id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
