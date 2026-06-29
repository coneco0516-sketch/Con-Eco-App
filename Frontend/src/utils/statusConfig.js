export const PRODUCT_STATUS_CONFIG = {
  'Pending':          { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: '⏳', label: 'Pending' },
  'Processing':      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  icon: '⚙️', label: 'Processing' },
  'Shipped':         { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.3)',  icon: '🚚', label: 'Shipped' },
  'Out for Delivery':{ color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',   border: 'rgba(6,182,212,0.3)',   icon: '📦', label: 'Out for Delivery' },
  'Delivered':       { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',   border: 'rgba(34,197,94,0.3)',   icon: '✅', label: 'Delivered' },
  'Completed':       { color: '#2ea043', bg: 'rgba(46,160,67,0.12)',   border: 'rgba(46,160,67,0.3)',   icon: '🎉', label: 'Completed' },
  'Cancelled':       { color: '#f85149', bg: 'rgba(248,81,73,0.12)',   border: 'rgba(248,81,73,0.3)',   icon: '❌', label: 'Cancelled' },
  'Bulk Requested':  { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: '📋', label: 'Bulk Requested' },
};

export const SERVICE_STATUS_CONFIG = {
  'Pending':        { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: '⏳', label: 'Awaiting Confirmation' },
  'Confirmed':      { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  icon: '✅', label: 'Confirmed' },
  'Scheduled':      { color: '#14b8a6', bg: 'rgba(20,184,166,0.12)',  border: 'rgba(20,184,166,0.3)',  icon: '📅', label: 'Scheduled' },
  'In Progress':    { color: '#f97316', bg: 'rgba(249,115,22,0.12)',   border: 'rgba(249,115,22,0.3)',   icon: '🔨', label: 'In Progress' },
  'Completed':      { color: '#2ea043', bg: 'rgba(46,160,67,0.12)',   border: 'rgba(46,160,67,0.3)',   icon: '🎉', label: 'Completed' },
  'Cancelled':      { color: '#f85149', bg: 'rgba(248,81,73,0.12)',   border: 'rgba(248,81,73,0.3)',   icon: '❌', label: 'Cancelled' },
  'Bulk Requested': { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)',  icon: '📋', label: 'Custom Request' },
};

export const PAYMENT_STATUS_CONFIG = {
  'Completed': { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'Paid':      { color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'Pending':   { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'Refunded':  { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  'Failed':    { color: '#f85149', bg: 'rgba(248,81,73,0.12)' },
};

export function getStatusConfig(status, orderType) {
  const config = orderType === 'Service' ? SERVICE_STATUS_CONFIG : PRODUCT_STATUS_CONFIG;
  return config[status] || { color: '#8b949e', bg: 'rgba(139,148,158,0.12)', border: 'rgba(139,148,158,0.3)', icon: '❓', label: status };
}
