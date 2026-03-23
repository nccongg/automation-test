/**
 * Simple Pagination Component
 * Displays Previous/Next navigation controls
 * 
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {function} onPageChange - Callback when page changes
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 border-t pt-6">
      <button
        type="button"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>&larr;</span>
        Previous
      </button>

      <div className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </div>

      <button
        type="button"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <span>&rarr;</span>
      </button>
    </div>
  );
}
