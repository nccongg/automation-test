import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/shared/components/common/LoadingSpinner';
import ErrorBanner from '@/shared/components/common/ErrorBanner';
import { createProject } from '@/features/projects/api/projectsApi';

export default function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && description.trim().length > 0 && baseUrl.trim().length > 0;
  }, [name, description, baseUrl]);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setBaseUrl('');
    setError('');
    setIsSubmitting(false);
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: name.trim(),
      description: description.trim(),
      base_url: baseUrl.trim(),
    };

    if (!canSubmit) {
      setError('Please fill in Project Name, Description, and Base URL.');
      return;
    }

    try {
      setIsSubmitting(true);
      const created = await createProject(payload);
      onCreated?.(created);
      onOpenChange?.(false);
    } catch (err) {
      setError(err?.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={true} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new test automation project for your website
          </DialogDescription>
        </DialogHeader>

        {error && <ErrorBanner message={error} fullWidth onDismiss={() => setError('')} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="e.g., Ecommerce Test"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Project Description</Label>
            <textarea
              id="project-description"
              placeholder="Enter project description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              className="min-h-[92px] w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-base-url">Base URL</Label>
            <Input
              id="project-base-url"
              placeholder="Enter website URL..."
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" label="Creating..." />
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

