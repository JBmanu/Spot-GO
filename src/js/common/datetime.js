

export function formatDate(timestamp) {
  return new Date(timestamp.seconds * 1000)
    .toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
}