export type SimpleSurveyView = 'ballot' | 'results';
export type SimpleSurveyResultsPage = 1 | 2;

interface ResolveSimpleSurveyViewInput {
  requestedView?: string | null;
  requestedPage?: string | null;
  requestedSubmitted?: string | null;
  hasExistingBallot: boolean;
  surveyState: 'draft' | 'live' | 'frozen';
  userRole?: 'admin' | 'member' | 'viewer';
}

interface ResolveSimpleSurveyViewResult {
  canEditBallot: boolean;
  view: SimpleSurveyView;
  resultsPage: SimpleSurveyResultsPage;
  showSubmittedFlash: boolean;
  canonicalSearch: string;
  shouldRedirect: boolean;
}

function buildCurrentSearch(
  requestedView?: string | null,
  requestedPage?: string | null,
  requestedSubmitted?: string | null
): string {
  const params = new URLSearchParams();

  if (requestedView) {
    params.set('view', requestedView);
  }

  if (requestedPage) {
    params.set('page', requestedPage);
  }

  if (requestedSubmitted === '1') {
    params.set('submitted', '1');
  }

  const search = params.toString();
  return search ? `?${search}` : '';
}

export function resolveSimpleSurveyView({
  requestedView,
  requestedPage,
  requestedSubmitted,
  hasExistingBallot,
  surveyState,
  userRole,
}: ResolveSimpleSurveyViewInput): ResolveSimpleSurveyViewResult {
  const canEditBallot = surveyState === 'live' && userRole !== 'viewer';
  const defaultView: SimpleSurveyView =
    canEditBallot && !hasExistingBallot ? 'ballot' : 'results';

  const normalizedRequestedView: SimpleSurveyView =
    requestedView === 'ballot' || requestedView === 'results'
      ? requestedView
      : defaultView;

  let view = normalizedRequestedView;
  if (view === 'results' && canEditBallot && !hasExistingBallot) {
    view = 'ballot';
  }
  if (view === 'ballot' && !canEditBallot) {
    view = 'results';
  }

  const resultsPage: SimpleSurveyResultsPage =
    view === 'results' && requestedPage === '2' ? 2 : 1;
  const showSubmittedFlash = view === 'results' && requestedSubmitted === '1';
  const canonicalSearch =
    view === 'ballot'
      ? '?view=ballot'
      : `?view=results${resultsPage === 2 ? '&page=2' : ''}${showSubmittedFlash ? '&submitted=1' : ''}`;

  return {
    canEditBallot,
    view,
    resultsPage,
    showSubmittedFlash,
    canonicalSearch,
    shouldRedirect:
      buildCurrentSearch(requestedView, requestedPage, requestedSubmitted) !==
      canonicalSearch,
  };
}
