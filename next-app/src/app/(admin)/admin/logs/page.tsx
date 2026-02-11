import { Metadata } from 'next';
import { getAdminLogs } from '@/lib/queries/admin';
import { getAllSurveys } from '@/lib/queries/surveys';
import { getBallotChangeLogs } from '@/lib/queries/ballots';
import LogsClient from './LogsClient';

export const metadata: Metadata = {
  title: 'Activity Logs - Admin',
};

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; surveyId?: string }>;
}) {
  const { tab, surveyId } = await searchParams;
  const selectedTab = tab || 'admin';
  const selectedSurveyId = surveyId || null;

  const adminLogs = await getAdminLogs({ limit: 100 });
  const allSurveys = await getAllSurveys();

  let ballotLogs: Awaited<ReturnType<typeof getBallotChangeLogs>> = [];
  if (selectedTab === 'ballots' && selectedSurveyId) {
    ballotLogs = await getBallotChangeLogs(selectedSurveyId);
  }

  return (
    <LogsClient
      adminLogs={adminLogs}
      ballotLogs={ballotLogs}
      surveys={allSurveys}
      selectedTab={selectedTab}
      selectedSurveyId={selectedSurveyId}
    />
  );
}
