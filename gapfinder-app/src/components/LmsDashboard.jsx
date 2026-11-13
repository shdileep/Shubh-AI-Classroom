import React, { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, BookOpen, FileText, Layers, Target, ClipboardCheck,
  ShieldAlert, Calendar, ListTodo, BarChart3, TrendingUp, History,
  Clock, Sparkles, Bot, Bookmark, BookmarkCheck, StickyNote, Settings,
  HelpCircle, LogOut, Search, Bell, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, XCircle, Plus, Trash2, Eye, RefreshCw,
  Play, ArrowRight, ArrowLeft, Check, X, Download, Upload, Filter,
  GraduationCap, Users, Flame, Zap, Award, Menu, MessageSquare, Send,
  FileCheck, BookMarked, Cpu, Sparkle, ExternalLink, User, Paperclip,
  GitCommit, ArrowUpRight, Minimize2
} from 'lucide-react';
import ProfileView from './ProfileView';
import FloatingAssistantDrawer from './FloatingAssistantDrawer';
import FlowchartViewer from './FlowchartViewer';
import heroImg from '../assets/hero.png';

export default function LmsDashboard({ onLogout, onBackToLanding, currentUser, authToken }) {
  // Robust teacher role detection (prevents role mismatches or student sidebar leak)
  const isTeacher = currentUser?.role === 'teacher' || currentUser?.email === 'admin@aiready.ac.in';

  // Navigation State
  const [activeTab, setActiveTab] = useState('overview'); // overview, materials, topics, diagnostics, gaps, revision, practice, analytics, history, assistant, bookmarks, notes, settings
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const mainScrollRef = useRef(null);

  // Global State
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Materials State
  const [documentsList, setDocumentsList] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [previewDocModal, setPreviewDocModal] = useState(null);

  // Topics Map State
  const [topicMapData, setTopicMapData] = useState(null);
  const [expandedUnits, setExpandedUnits] = useState({ 'Unit 1': true, 'Unit 2': true, 'Unit 3': true, 'Unit 4': true, 'Unit 5': true });

  // Diagnostic Test State
  const [testMode, setTestMode] = useState('Initial Diagnostic');
  const [diagnosticCount, setDiagnosticCount] = useState(10);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [testTimer, setTestTimer] = useState(900); // 15 mins in seconds
  const [timerRunning, setTimerRunning] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [submittingTest, setSubmittingTest] = useState(false);

  // Knowledge Gap Report State
  const [gapReportData, setGapReportData] = useState(null);
  const [selectedGapFilter, setSelectedGapFilter] = useState('all'); // all, weak, medium, strong

  // Revision Planner State
  const [revisionPlanData, setRevisionPlanData] = useState(null);
  const [revisionFilter, setRevisionFilter] = useState('all'); // all, pending, completed

  // Grounded Practice State (10 Questions × 10 Marks = 100 Marks Examination)
  const [practiceTopic, setPracticeTopic] = useState('');
  const [practiceTopicsList, setPracticeTopicsList] = useState([]);
  const [practicePaperData, setPracticePaperData] = useState(null);
  const [practiceActiveQuestionIndex, setPracticeActiveQuestionIndex] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState({});
  const [practiceSavedQuestions, setPracticeSavedQuestions] = useState([]);
  const [practicePaperLoading, setPracticePaperLoading] = useState(false);
  const [practicePaperSubmitting, setPracticePaperSubmitting] = useState(false);
  const [practiceDocTitle, setPracticeDocTitle] = useState('');
  const [practiceHasDocuments, setPracticeHasDocuments] = useState(true);
  const [practiceDrills, setPracticeDrills] = useState([]);
  const [practiceAnswer, setPracticeAnswer] = useState(null);
  const [practiceSubmitted, setPracticeSubmitted] = useState(false);
  const [practiceFeedback, setPracticeFeedback] = useState(null);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);

  // History State
  const [historyList, setHistoryList] = useState([]);

  // Revision Date Picker, Alerts, and Personal PDF State
  const [revisionTargetDate, setRevisionTargetDate] = useState('2026-12-15');
  const [revisionAlertsEnabled, setRevisionAlertsEnabled] = useState(true);
  const [personalRevisionFiles, setPersonalRevisionFiles] = useState([]);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [selectedPdfDoc, setSelectedPdfDoc] = useState(null);
  const [pdfCurrentPage, setPdfCurrentPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState('all'); // all, quiz, revision, material
  const [examMappingsData, setExamMappingsData] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [broadcastingDrill, setBroadcastingDrill] = useState(false);

  // Timed Revision Scheduler State (with Resend 5-min Email Reminder)
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledSessions, setScheduledSessions] = useState([]);
  const [scheduleForm, setScheduleForm] = useState({
    title: 'Pre-Exam Diagnostic Revision Drill',
    scheduled_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    scheduled_time: '18:00',
    document_id: '',
    topic: 'Core Foundations'
  });
  const [schedulingLoading, setSchedulingLoading] = useState(false);

  // ===================== TEACHER COHORT & ASSIGNMENT TELEMETRY STATE =====================
  const [teacherStudentsList, setTeacherStudentsList] = useState([]);
  const [selectedStudentForEyeModal, setSelectedStudentForEyeModal] = useState(null);
  const [eyeModalOpen, setEyeModalOpen] = useState(false);
  const [eyeModalLoading, setEyeModalLoading] = useState(false);
  const [cohortGraphData, setCohortGraphData] = useState(null);
  const [activeGraphDot, setActiveGraphDot] = useState(null);
  const [weakerStudentsList, setWeakerStudentsList] = useState([]);
  const [teacherAssignmentsList, setTeacherAssignmentsList] = useState([]);
  const [selectedAssignmentForSubmissions, setSelectedAssignmentForSubmissions] = useState(null);
  const [assignmentSubmissionsData, setAssignmentSubmissionsData] = useState(null);
  const [submissionsSort, setSubmissionsSort] = useState('high_to_low'); // 'high_to_low' | 'low_to_high'
  const [adminHistoryList, setAdminHistoryList] = useState([]);
  const [teacherActiveTab, setTeacherActiveTab] = useState('overview'); // 'overview', 'students', 'progress_graph', 'weaker_students', 'create_assignment', 'submissions', 'history'

  // Scroll to top automatically whenever teacher or student switches tabs
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [teacherActiveTab, activeTab]);

  // Teacher Assignment Creator Form State
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    topic: '',
    start_time: new Date().toISOString().slice(0, 16),
    end_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    faculty_name: currentUser?.name || 'Faculty Administrator',
    subject: 'Core Curriculum',
    assignment_type: 'quiz', // 'quiz' (30 MCQs, 30 min) or 'question_paper' (10 questions, 45 min)
    file: null
  });
  const [assignmentCreating, setAssignmentCreating] = useState(false);

  // Student Assignment Attempt State (Assigned by Faculty)
  const [studentAssignmentsList, setStudentAssignmentsList] = useState([]);
  const [pendingStudentAssignmentsCount, setPendingStudentAssignmentsCount] = useState(0);
  const [activeStudentAssignment, setActiveStudentAssignment] = useState(null);
  const [studentAssignmentQuestions, setStudentAssignmentQuestions] = useState([]);
  const [studentAssignmentAnswers, setStudentAssignmentAnswers] = useState({});
  const [studentAssignmentTimer, setStudentAssignmentTimer] = useState(1800);
  const [studentAssignmentTimerActive, setStudentAssignmentTimerActive] = useState(false);
  const [studentAssignmentSubmitting, setStudentAssignmentSubmitting] = useState(false);
  const [studentAssignmentResult, setStudentAssignmentResult] = useState(null);
  const [studentAssignmentModalOpen, setStudentAssignmentModalOpen] = useState(false);

  // AI Assistant State
  const studentDisplayName = currentUser?.name || 'Student';
  const [isFloatingAssistantOpen, setIsFloatingAssistantOpen] = useState(false);
  const [assistantAttachment, setAssistantAttachment] = useState(null);
  const fullAssistantFileInputRef = useRef(null);

  const [assistantMessages, setAssistantMessages] = useState([]);

  const [assistantInput, setAssistantInput] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantTopic, setAssistantTopic] = useState('');

  // Bookmarks & Notes State
  const [bookmarksList, setBookmarksList] = useState([]);
  const [notesList, setNotesList] = useState([]);
  const [newNoteModal, setNewNoteModal] = useState(false);
  const [newNoteData, setNewNoteData] = useState({ topic: '', title: '', content: '', tags: '' });

  // Preferences
  const [preferences, setPreferences] = useState({
    target_exam_date: '2026-12-15',
    daily_study_minutes: 90,
    preferred_difficulty: 'Moderate',
    notifications_enabled: true
  });

  // View Role strictly determined by authenticated user role (no student-to-teacher switching)
  const [viewRole, setViewRole] = useState(() => (isTeacher ? 'teacher' : 'student'));

  useEffect(() => {
    setViewRole(isTeacher ? 'teacher' : 'student');
  }, [currentUser, isTeacher]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const getToken = () => authToken || localStorage.getItem('gapfinder_token');

  const handleCreateRevisionSchedule = async (e) => {
    e.preventDefault();
    if (!scheduleForm.title.trim()) {
      showToast('Please enter a session title.', 'error');
      return;
    }
    setSchedulingLoading(true);
    const token = getToken();
    try {
      const res = await fetch('/api/revision-plans/schedule-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: scheduleForm.title.trim(),
          scheduled_date: scheduleForm.scheduled_date,
          scheduled_time: scheduleForm.scheduled_time,
          document_id: scheduleForm.document_id ? parseInt(scheduleForm.document_id) : null,
          topic: scheduleForm.topic || 'Core Foundations'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to schedule session.');
      }

      showToast(`⚡ Session scheduled! 5-minute reminder email dispatched to your inbox.`);
      setShowScheduleModal(false);

      // Refresh scheduled sessions list
      const sRes = await fetch('/api/revision-plans/scheduled-sessions', { headers: { 'Authorization': `Bearer ${token}` } });
      if (sRes.ok) {
        const sData = await sRes.json();
        setScheduledSessions(sData.sessions || []);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSchedulingLoading(false);
    }
  };

  // Fetch initial dashboard bundle
  const loadInitialData = async () => {
    const token = getToken();
    if (!token) {
      onLogout();
      return;
    }
    setLoading(true);
    try {
      // 1. Dashboard summary
      const dRes = await fetch('/api/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
      if (dRes.ok) {
        const dData = await dRes.json();
        setDashboardData(dData);
      }

      // 2. Documents
      const docRes = await fetch('/api/documents', { headers: { 'Authorization': `Bearer ${token}` } });
      if (docRes.ok) {
        const docs = await docRes.json();
        setDocumentsList(docs.documents || []);
      }

      // 3. Topic map
      const tRes = await fetch('/api/topics/map', { headers: { 'Authorization': `Bearer ${token}` } });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTopicMapData(tData);
      }

      // 4. Gap report
      const gRes = await fetch('/api/knowledge-gaps/report', { headers: { 'Authorization': `Bearer ${token}` } });
      if (gRes.ok) {
        const gData = await gRes.json();
        setGapReportData(gData);
      }

      // 5. Revision plan
      const rRes = await fetch('/api/revision-plans', { headers: { 'Authorization': `Bearer ${token}` } });
      if (rRes.ok) {
        const rData = await rRes.json();
        setRevisionPlanData(rData);
      }

      // 6. Analytics
      const aRes = await fetch('/api/analytics/overview', { headers: { 'Authorization': `Bearer ${token}` } });
      if (aRes.ok) {
        const aData = await aRes.json();
        setAnalyticsData(aData);
      }

      // 7. History
      const hRes = await fetch('/api/history', { headers: { 'Authorization': `Bearer ${token}` } });
      if (hRes.ok) {
        const hData = await hRes.json();
        setHistoryList(hData.activities || []);
      }

      // 8. Bookmarks & Notes
      const bRes = await fetch('/api/personal/bookmarks', { headers: { 'Authorization': `Bearer ${token}` } });
      if (bRes.ok) {
        const bData = await bRes.json();
        setBookmarksList(bData.bookmarks || []);
      }

      const nRes = await fetch('/api/personal/notes', { headers: { 'Authorization': `Bearer ${token}` } });
      if (nRes.ok) {
        const nData = await nRes.json();
        setNotesList(nData.notes || []);
      }

      // 9. Preferences
      const pRes = await fetch('/api/personal/preferences', { headers: { 'Authorization': `Bearer ${token}` } });
      if (pRes.ok) {
        const pData = await pRes.json();
        setPreferences(pData);
        if (pData.target_exam_date) setRevisionTargetDate(pData.target_exam_date);
        if (pData.notifications_enabled !== undefined) setRevisionAlertsEnabled(Boolean(pData.notifications_enabled));
      }

      // 10. Retrieval-Grounded Exam Mappings
      try {
        const emRes = await fetch('/api/topics/exam-mappings', { headers: { 'Authorization': `Bearer ${token}` } });
        if (emRes.ok) {
          const emData = await emRes.json();
          setExamMappingsData(emData);
        }
      } catch (emErr) {
        console.error('Exam mappings error:', emErr);
      }

      // 11. Teacher Cohort Overview
      if (isTeacher) {
        try {
          const teaRes = await fetch('/api/teacher/overview', { headers: { 'Authorization': `Bearer ${token}` } });
          if (teaRes.ok) {
            const teaData = await teaRes.json();
            setTeacherData(teaData);
          }
        } catch (teaErr) {
          console.error('Teacher data error:', teaErr);
        }
      }

      // 12. Scheduled Timed Revision Sessions
      try {
        const sRes = await fetch('/api/revision-plans/scheduled-sessions', { headers: { 'Authorization': `Bearer ${token}` } });
        if (sRes.ok) {
          const sData = await sRes.json();
          setScheduledSessions(sData.sessions || []);
        }
      } catch (sErr) {
        console.warn('Scheduled sessions load note:', sErr);
      }

      // 13. Teacher-Specific Datasets (Students Directory, Graph, Weaker Students, Assignments, History)
      if (isTeacher) {
        try {
          const [stRes, gRes, wRes, aRes, hRes] = await Promise.all([
            fetch('/api/teacher/students', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/teacher/cohort-progress-graph', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/teacher/weaker-students', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/teacher/assignments', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/teacher/history', { headers: { 'Authorization': `Bearer ${token}` } })
          ]);
          if (stRes.ok) {
            const stData = await stRes.json();
            setTeacherStudentsList(stData.students || []);
          }
          if (gRes.ok) {
            const gData = await gRes.json();
            setCohortGraphData(gData);
          }
          if (wRes.ok) {
            const wData = await wRes.json();
            setWeakerStudentsList(wData.weaker_students || []);
          }
          if (aRes.ok) {
            const aData = await aRes.json();
            setTeacherAssignmentsList(aData.assignments || []);
          }
          if (hRes.ok) {
            const hData = await hRes.json();
            setAdminHistoryList(hData.history || []);
          }
        } catch (teaErr) {
          console.error('Teacher specific data fetch error:', teaErr);
        }
      }

      // 14. Student Assignments Telemetry
      try {
        const saRes = await fetch('/api/student/assignments', { headers: { 'Authorization': `Bearer ${token}` } });
        if (saRes.ok) {
          const saData = await saRes.json();
          setStudentAssignmentsList(saData.assignments || []);
          setPendingStudentAssignmentsCount(saData.pending_notification_count || 0);
        }
      } catch (saErr) {
        console.warn('Student assignments fetch error:', saErr);
      }

      // 15. Grounded Practice Topics
      if (!isTeacher) {
        try {
          fetchPracticeTopics();
        } catch (_) {}
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading LMS data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [authToken]);

  // Timer countdown for active diagnostic test
  useEffect(() => {
    let interval = null;
    if (timerRunning && testTimer > 0) {
      interval = setInterval(() => {
        setTestTimer(t => t - 1);
      }, 1000);
    } else if (testTimer === 0 && timerRunning) {
      setTimerRunning(false);
      handleFinishTest();
    }
    return () => clearInterval(interval);
  }, [timerRunning, testTimer]);

  // Timer countdown for student assigned Quiz (30 min) / Question Paper (45 min)
  useEffect(() => {
    let interval = null;
    if (studentAssignmentTimerActive && studentAssignmentTimer > 0) {
      interval = setInterval(() => {
        setStudentAssignmentTimer(t => t - 1);
      }, 1000);
    } else if (studentAssignmentTimer === 0 && studentAssignmentTimerActive) {
      setStudentAssignmentTimerActive(false);
      handleSubmitStudentAssignment();
    }
    return () => clearInterval(interval);
  }, [studentAssignmentTimerActive, studentAssignmentTimer]);

  // Eye Icon Handler: Load student materials summary for floating card modal
  const handleOpenEyeModal = async (studentId) => {
    setEyeModalLoading(true);
    setSelectedStudentForEyeModal(null);
    setEyeModalOpen(true);
    const token = getToken();
    try {
      const res = await fetch(`/api/teacher/students/${studentId}/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedStudentForEyeModal(data);
      } else {
        showToast('Unable to load student materials.', 'error');
      }
    } catch (e) {
      showToast('Error loading student materials', 'error');
    } finally {
      setEyeModalLoading(false);
    }
  };

  // Teacher Assignment Creation Handler
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignmentForm.title.trim()) {
      showToast('Please enter an assignment title.', 'error');
      return;
    }
    if (!assignmentForm.file) {
      showToast('Please upload a course document (PDF/DOCX/TXT/MD).', 'error');
      return;
    }

    setAssignmentCreating(true);
    const token = getToken();
    try {
      const fd = new FormData();
      fd.append('file', assignmentForm.file);
      fd.append('title', assignmentForm.title.trim());
      fd.append('topic', assignmentForm.topic);
      fd.append('start_time', assignmentForm.start_time);
      fd.append('end_time', assignmentForm.end_time);
      fd.append('faculty_name', assignmentForm.faculty_name);
      fd.append('subject', assignmentForm.subject);
      fd.append('assignment_type', assignmentForm.assignment_type);

      const res = await fetch('/api/teacher/assignments/create', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to create assignment.');
      }

      showToast(`🎉 Assignment published! Grounded ${data.total_questions} questions in uploaded document.`);
      setAssignmentForm({
        title: '',
        topic: '',
        start_time: new Date().toISOString().slice(0, 16),
        end_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        faculty_name: currentUser?.name || 'Faculty Administrator',
        subject: 'Core Curriculum',
        assignment_type: 'quiz',
        file: null
      });

      // Refresh assignments & history
      const [aRes, hRes, ovRes] = await Promise.all([
        fetch('/api/teacher/assignments', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/teacher/history', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/teacher/overview', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (aRes.ok) {
        const aData = await aRes.json();
        setTeacherAssignmentsList(aData.assignments || []);
      }
      if (hRes.ok) {
        const hData = await hRes.json();
        setAdminHistoryList(hData.history || []);
      }
      if (ovRes.ok) {
        const ovData = await ovRes.json();
        setTeacherData(ovData);
      }
      setTeacherActiveTab('submissions');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setAssignmentCreating(false);
    }
  };

  // View Submissions for Assignment (with High to Low / Low to High sorting)
  const handleViewSubmissions = async (assignment, sort = 'high_to_low') => {
    setSelectedAssignmentForSubmissions(assignment);
    setSubmissionsSort(sort);
    const token = getToken();
    try {
      const res = await fetch(`/api/teacher/assignments/${assignment.id}/submissions?sort=${sort}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignmentSubmissionsData(data);
        setTeacherActiveTab('submissions');
      }
    } catch (e) {
      showToast('Error loading submissions', 'error');
    }
  };

  // Student Assignment Launch Runner
  const handleStartStudentAssignment = async (assign) => {
    if (!assign.can_attempt) {
      showToast(`Cannot attempt: ${assign.time_status_label}`, 'error');
      return;
    }
    const token = getToken();
    try {
      const res = await fetch(`/api/student/assignments/${assign.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Unable to open assignment.');
      }
      const data = await res.json();
      setActiveStudentAssignment(data);
      setStudentAssignmentQuestions(data.questions || []);
      setStudentAssignmentAnswers({});
      setStudentAssignmentTimer((data.duration_minutes || 30) * 60);
      setStudentAssignmentTimerActive(true);
      setStudentAssignmentResult(null);
      setStudentAssignmentModalOpen(true);
      try {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (_) {}
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  // Student Assignment Submission
  const handleSubmitStudentAssignment = async () => {
    if (!activeStudentAssignment) return;
    setStudentAssignmentSubmitting(true);
    const token = getToken();
    try {
      const totalTime = (activeStudentAssignment.duration_minutes || 30) * 60;
      const timeSpent = Math.max(1, totalTime - studentAssignmentTimer);
      const res = await fetch(`/api/student/assignments/${activeStudentAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          answers: studentAssignmentAnswers,
          time_spent_seconds: timeSpent
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Submission failed.');
      }

      setStudentAssignmentTimerActive(false);
      setStudentAssignmentResult(data);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
      } catch (_) {}
      showToast(`🎉 Assignment submitted! Score: ${data.percentage}% (${data.score}/${data.total_marks})`);

      // Refresh student assignments & dashboard
      const saRes = await fetch('/api/student/assignments', { headers: { 'Authorization': `Bearer ${token}` } });
      if (saRes.ok) {
        const saData = await saRes.json();
        setStudentAssignmentsList(saData.assignments || []);
        setPendingStudentAssignmentsCount(saData.pending_notification_count || 0);
      }
      // Refresh gaps
      const gRes = await fetch('/api/gaps/report', { headers: { 'Authorization': `Bearer ${token}` } });
      if (gRes.ok) {
        const gData = await gRes.json();
        setGapReportData(gData);
      }
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setStudentAssignmentSubmitting(false);
    }
  };

  // Document Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = getToken();
    setUploadingDoc(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject', currentUser?.course || 'Diagnostic Course Materials');
    formData.append('doc_type', file.name.includes('Syllabus') ? 'Syllabus' : (file.name.includes('Exam') ? 'Past Papers' : 'Textbook'));

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`✅ "${file.name}" indexed! Extracted topics and auto-generated study notes.`);
        // Reload full dashboard state including topic map, notes, and activity history
        loadInitialData();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Failed to upload document.', 'error');
      }
    } catch (err) {
      showToast('Error uploading document.', 'error');
    } finally {
      setUploadingDoc(false);
      e.target.value = '';
    }
  };

  // Preview Document Chunks
  const handlePreviewDoc = async (docId) => {
    const token = getToken();
    try {
      const res = await fetch(`/api/documents/${docId}/preview`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewDocModal(data);
      }
    } catch (err) {
      showToast('Unable to load document preview.', 'error');
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Delete this document and remove its source chunks from the retrieval engine?')) return;
    const token = getToken();
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setDocumentsList(docs => docs.filter(d => d.id !== docId));
        showToast('Document deleted.');
      }
    } catch (err) {
      showToast('Error deleting document.', 'error');
    }
  };

  // Start Diagnostic Assessment
  const handleStartDiagnostic = async (mode = 'Initial Diagnostic', topicFilter = null, questionCount = null) => {
    const token = getToken();
    setLoading(true);
    const countToSend = questionCount || diagnosticCount || 10;
    try {
      const res = await fetch('/api/assessments/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: currentUser?.course || 'Active Diagnostic Workspace',
          mode: mode,
          topic_filter: topicFilter,
          question_count: countToSend,
          difficulty: 'Moderate'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveAssessment(data);
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setMarkedForReview({});
        setAssessmentResults(null);
        setTestTimer(data.duration_minutes * 60 || 900);
        setTimerRunning(true);
        setActiveTab('diagnostics');
        try {
          if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(() => {});
          }
        } catch (_) {}
      }
    } catch (err) {
      showToast('Error generating assessment.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Diagnostic Assessment
  const handleFinishTest = async () => {
    if (!activeAssessment) return;
    const token = getToken();
    setSubmittingTest(true);
    setTimerRunning(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch (_) {}

    try {
      const res = await fetch('/api/assessments/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assessment_id: activeAssessment.assessment_id,
          answers: userAnswers,
          time_spent_seconds: (activeAssessment.duration_minutes * 60) - testTimer
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAssessmentResults(data);
        showToast('Diagnostic assessment evaluated by AI engine!');
        // Refresh gaps and dashboard
        loadInitialData();
      } else {
        showToast('Submission error.', 'error');
      }
    } catch (err) {
      showToast('Network error during test submission.', 'error');
    } finally {
      setSubmittingTest(false);
    }
  };

  // Toggle Revision Task Complete
  const handleToggleRevisionTask = async (taskId, currentCompleted) => {
    const token = getToken();
    const newStatus = !currentCompleted;
    try {
      const res = await fetch(`/api/revision-plans/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ task_id: taskId, completed: newStatus })
      });

      if (res.ok) {
        setRevisionPlanData(prev => {
          if (!prev) return prev;
          const updatedTasks = prev.tasks.map(t => t.id === taskId ? { ...t, completed: newStatus } : t);
          return {
            ...prev,
            tasks: updatedTasks,
            completed_tasks_count: updatedTasks.filter(t => t.completed).length,
            remaining_tasks_count: updatedTasks.filter(t => !t.completed).length
          };
        });
        showToast(newStatus ? 'Revision task completed!' : 'Task reopened.');
      }
    } catch (err) {
      showToast('Error updating task.', 'error');
    }
  };

  // Grounded Practice: Fetch Real Topics from Uploaded Documents
  const fetchPracticeTopics = async () => {
    const token = getToken();
    try {
      const res = await fetch('/api/practice/topics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPracticeTopicsList(data.topics || []);
        setPracticeDocTitle(data.document_title || '');
        setPracticeHasDocuments(Boolean(data.has_documents));
        
        if (data.topics && data.topics.length > 0) {
          const firstTopic = data.topics[0].topic;
          setPracticeTopic(firstTopic);
          loadPracticePaper(firstTopic);
        }
      }
    } catch (err) {
      console.error('Error fetching practice topics:', err);
    }
  };

  // Grounded Practice: Load 10-Question Grounded Paper
  const loadPracticePaper = async (topicName) => {
    if (!topicName) return;
    setPracticePaperLoading(true);
    setPracticeTopic(topicName);
    const token = getToken();
    try {
      const res = await fetch(`/api/practice/paper?topic=${encodeURIComponent(topicName)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPracticePaperData(data);
        setPracticeActiveQuestionIndex(0);
        
        if (data.has_submitted && data.submission) {
          setPracticeAnswers(data.submission.answers || {});
          setPracticeSavedQuestions(Object.keys(data.submission.answers || {}).map(k => parseInt(k, 10)));
        } else {
          setPracticeAnswers({});
          setPracticeSavedQuestions([]);
        }
      } else {
        showToast('Unable to load question paper for this topic.', 'error');
      }
    } catch (err) {
      showToast('Error loading question paper.', 'error');
    } finally {
      setPracticePaperLoading(false);
    }
  };

  // Launch Practice from another tab
  const handleLaunchPractice = async (topicName) => {
    setActiveTab('practice');
    await loadPracticePaper(topicName);
  };

  // Grounded Practice: Save & Next
  const handleSaveAndNextPracticeQuestion = () => {
    if (!practicePaperData?.questions) return;
    const currentQ = practicePaperData.questions[practiceActiveQuestionIndex];
    const qNum = currentQ?.number || currentQ?.id || (practiceActiveQuestionIndex + 1);
    const ansText = (practiceAnswers[qNum] || '').trim();

    if (ansText) {
      if (!practiceSavedQuestions.includes(qNum)) {
        setPracticeSavedQuestions(prev => [...prev, qNum]);
      }
    }

    if (practiceActiveQuestionIndex < practicePaperData.questions.length - 1) {
      setPracticeActiveQuestionIndex(prev => prev + 1);
    } else {
      showToast(`Question ${qNum} saved! All 10 questions accessed.`);
    }
  };

  // Grounded Practice: Submit Paper (Harsh Evaluation)
  const handleSubmitPracticePaper = async () => {
    if (!practicePaperData) return;
    const answeredCount = Object.keys(practiceAnswers).filter(k => (practiceAnswers[k] || '').trim()).length;
    if (answeredCount < 1) {
      showToast('Please provide an answer to at least one question before submitting.', 'error');
      return;
    }

    setPracticePaperSubmitting(true);
    const token = getToken();
    try {
      const res = await fetch('/api/practice/paper/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paper_id: practicePaperData.paper_id,
          topic: practiceTopic,
          answers: practiceAnswers
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Evaluation failed.');
      }

      showToast(`🎉 Practice Examination Evaluated! Score: ${data.score}/100 (${data.percentage}%)`);
      await loadPracticePaper(practiceTopic);
      loadInitialData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setPracticePaperSubmitting(false);
    }
  };

  // Submit Practice Drill Answer (Legacy Fallback)
  const handleSubmitPractice = async (drill) => {
    if (practiceAnswer === null) {
      showToast('Please select an answer.', 'error');
      return;
    }
    const token = getToken();
    try {
      const res = await fetch('/api/practice/submit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          topic: practiceTopic,
          drill_id: drill.id,
          selected_option_index: practiceAnswer,
          correct_option_index: drill.correct_option_index
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPracticeSubmitted(true);
        setPracticeFeedback(data);
        showToast(data.message);
        loadInitialData();
      }
    } catch (err) {
      showToast('Error grading practice answer.', 'error');
    }
  };

  // Shubh AI Assistant Send Message
  const handleSendMessage = async (customMessage = null, extraData = {}) => {
    const userMsg = (customMessage || assistantInput).trim();
    const attName = (typeof extraData === 'object' && extraData?.attachment_name) ? extraData.attachment_name : assistantAttachment?.name || null;
    const attContent = (typeof extraData === 'object' && extraData?.attachment_content) ? extraData.attachment_content : assistantAttachment?.content || null;
    const actionType = (typeof extraData === 'string') ? extraData : (extraData?.action_type || null);

    if (!userMsg && !attName) return;
    const token = getToken();
    setAssistantInput('');
    setAssistantAttachment(null);

    const displayMsg = userMsg || `Analyzing document: ${attName}`;
    const newMsgs = [...assistantMessages, { role: 'user', text: displayMsg }];
    setAssistantMessages(newMsgs);
    setAssistantLoading(true);

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: displayMsg,
          topic: assistantTopic || 'Foundational Concepts',
          action_type: actionType,
          attachment_name: attName,
          attachment_content: attContent
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAssistantMessages([
          ...newMsgs,
          {
            role: 'assistant',
            text: data.reply,
            citations: data.citations || []
          }
        ]);
      } else {
        const regName = currentUser?.name || 'Student';
        setAssistantMessages([
          ...newMsgs,
          {
            role: 'assistant',
            text: `Hi ${regName}, I'm Shubh AI Assistant, your personal helper. How can I help you today?`,
            citations: []
          }
        ]);
      }
    } catch (err) {
      showToast('Assistant connection failed.', 'error');
    } finally {
      setAssistantLoading(false);
    }
  };

  // Save Bookmark
  const handleSaveBookmark = async (itemType, title, subtitle, sourceRef, topic) => {
    const token = getToken();
    try {
      const res = await fetch('/api/personal/bookmarks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          item_type: itemType,
          title: title,
          subtitle: subtitle,
          source_ref: sourceRef,
          topic: topic,
          link_tab: 'diagnosis'
        })
      });
      if (res.ok) {
        showToast('Saved to bookmarks!');
        const bRes = await fetch('/api/personal/bookmarks', { headers: { 'Authorization': `Bearer ${token}` } });
        if (bRes.ok) {
          const bData = await bRes.json();
          setBookmarksList(bData.bookmarks || []);
        }
      }
    } catch (err) {
      showToast('Error saving bookmark.', 'error');
    }
  };

  // Create Note
  const handleCreateNote = async () => {
    if (!newNoteData.title || !newNoteData.content) {
      showToast('Please provide note title and content.', 'error');
      return;
    }
    const token = getToken();
    try {
      const res = await fetch('/api/personal/notes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newNoteData)
      });
      if (res.ok) {
        showToast('Note saved successfully!');
        setNewNoteModal(false);
        setNewNoteData({ topic: 'Core Concept', title: '', content: '', tags: 'Course Material' });
        const nRes = await fetch('/api/personal/notes', { headers: { 'Authorization': `Bearer ${token}` } });
        if (nRes.ok) {
          const nData = await nRes.json();
          setNotesList(nData.notes || []);
        }
      }
    } catch (err) {
      showToast('Error saving note.', 'error');
    }
  };

  // Download Knowledge Gap Report
  const handleDownloadReport = () => {
    if (!gapReportData) return;
    const reportText = `GAPFINDER AI — KNOWLEDGE GAP REPORT\nStudent: ${currentUser?.name || 'Student'} · ${currentUser?.course || 'Active Diagnostic Workspace'}\nOverall Diagnostic Score: ${gapReportData.overall_diagnostic_score}%\n\n` +
      `TOPIC-LEVEL DIAGNOSES:\n` +
      gapReportData.topic_diagnoses.map(t => 
        `----------------------------------------\n` +
        `TOPIC: ${t.topic} [${t.classification.toUpperCase()} — ${t.mastery_score}%]\n` +
        `Unit: ${t.unit} (Exam Weight: ${t.exam_weight})\n` +
        `Root Cause: ${t.root_cause}\n` +
        `Misconception: ${t.misconception}\n` +
        `Blocked Prerequisites: ${t.blocked_prerequisites.join(', ') || 'None'}\n` +
        `Grounding Source: ${t.grounding}\n` +
        `Recommended Action: ${t.recommended_action}\n`
      ).join('\n');

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GapFinder_Knowledge_Gap_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Knowledge Gap Report downloaded!');
  };

  // Reset Gaps to Baseline
  const handleResetGaps = async () => {
    const token = getToken();
    try {
      const res = await fetch('/api/dashboard/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToast('Knowledge baseline reset.');
        loadInitialData();
      }
    } catch (err) {
      showToast('Error resetting gaps.', 'error');
    }
  };

  // Nav Items Definitions (Strictly separated for Student vs Instructor)
  const studentNavItems = [
    {
      section: 'LEARNING',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
        { id: 'materials', label: 'My Materials', icon: FileText, badge: documentsList.length ? `${documentsList.length}` : null },
        { id: 'topics', label: 'Topic Map', icon: Layers, badge: null },
        { id: 'diagnostics', label: 'Skill Assessments', icon: Target, badge: 'Adaptive' },
        { id: 'practice', label: 'Practice Questions', icon: Zap, badge: null },
      ]
    },
    {
      section: 'MY PERFORMANCE',
      items: [
        { id: 'gaps', label: 'Knowledge Gap Report', icon: ShieldAlert, badge: 'Core', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
        { id: 'revision', label: 'Revision Planner', icon: Calendar, badge: revisionPlanData?.remaining_tasks_count ? `${revisionPlanData.remaining_tasks_count} tasks` : null },
        { id: 'analytics', label: 'Progress Analytics', icon: BarChart3, badge: null },
        { id: 'history', label: 'Learning History', icon: History, badge: null },
      ]
    },
    {
      section: 'PERSONAL',
      items: [
        { id: 'assistant', label: 'Shubh AI Assistant', icon: Sparkles, badge: 'AI', badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' },
        { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, badge: bookmarksList.length ? `${bookmarksList.length}` : null },
        { id: 'notes', label: 'My Notes', icon: StickyNote, badge: notesList.length ? `${notesList.length}` : null },
      ]
    },
    {
      section: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Settings', icon: Settings, badge: null },
        { id: 'profile', label: 'Profile & Streaks', icon: User, badge: 'Live' },
      ]
    }
  ];

  const teacherNavItems = [
    {
      section: 'COHORT & STUDENTS',
      items: [
        { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, badge: 'Live' },
        { id: 'students', label: 'Student Directory', icon: Users, badge: teacherStudentsList.length ? `${teacherStudentsList.length}` : '9' },
        { id: 'progress_graph', label: 'Cohort Progress (0-100%)', icon: TrendingUp, badge: null },
        { id: 'weaker_students', label: 'Weaker Students Radar', icon: ShieldAlert, badge: weakerStudentsList.length ? `${weakerStudentsList.length} alert` : null, badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800' },
      ]
    },
    {
      section: 'ASSIGNMENTS & EXAMS',
      items: [
        { id: 'create_assignment', label: 'Create Assignment', icon: Plus, badge: 'Quiz & Paper', badgeColor: 'bg-emerald-950 text-emerald-300 border border-emerald-700/60' },
        { id: 'submissions', label: 'Student Submissions', icon: ClipboardCheck, badge: teacherAssignmentsList.reduce((acc, a) => acc + (a.submissions_count || 0), 0) ? `${teacherAssignmentsList.reduce((acc, a) => acc + (a.submissions_count || 0), 0)} attempts` : null },
      ]
    },
    {
      section: 'INSTITUTIONAL AUDIT',
      items: [
        { id: 'history', label: 'Admin Audit History', icon: History, badge: adminHistoryList.length ? `${adminHistoryList.length}` : null },
      ]
    }
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  const handleNavClick = (itemId) => {
    if (isTeacher) {
      setTeacherActiveTab(itemId);
    } else {
      setActiveTab(itemId);
    }
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    setMobileMenuOpen(false);
  };

  const isNavActive = (itemId) => {
    if (isTeacher) {
      if (itemId === 'submissions') {
        return teacherActiveTab === 'submissions' || teacherActiveTab === 'assignments_submissions';
      }
      return teacherActiveTab === itemId;
    }
    return activeTab === itemId;
  };

  // Reusable Math Grid Paper Cohort Progress Graph (Image 1 replica)
  const renderMathGridProgressChart = () => {
    const rawList = cohortGraphData?.students?.length ? cohortGraphData.students : teacherStudentsList;
    const studentsToPlot = rawList.slice(0, 12);
    const n = Math.max(studentsToPlot.length, 1);
    const stepX = 700 / (n + 1);

    const ptsHigh = studentsToPlot.map((st, idx) => ({
      x: 65 + (idx + 1) * stepX,
      y: 25 + (100 - (st.highest_score ?? 78)) * 2.65,
      score: st.highest_score ?? 78,
      student_name: st.student_name || st.name,
      topic: st.topics?.[0]?.topic || 'Core Curriculum Mastery',
      series: 'high'
    }));

    const ptsLow = studentsToPlot.map((st, idx) => ({
      x: 65 + (idx + 1) * stepX,
      y: 25 + (100 - (st.lowest_score ?? 42)) * 2.65,
      score: st.lowest_score ?? 42,
      student_name: st.student_name || st.name,
      topic: st.topics?.[1]?.topic || st.topics?.[0]?.topic || 'At-Risk Concept',
      series: 'low'
    }));

    const polyHigh = ptsHigh.map(p => `${p.x},${p.y}`).join(' ');
    const polyLow = ptsLow.map(p => `${p.x},${p.y}`).join(' ');

    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-900 px-2.5 py-0.5 rounded-full border border-blue-200">
                Telemetry Progression
              </span>
              <h3 className="font-bold text-base text-gray-900">Cohort Student Performance Graph (0–100%)</h3>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              X-axis: Enrolled Students · Y-axis: 0–100% Mastery Criteria. Tap any dot to view student performance details.
            </p>
          </div>
        </div>

        {/* Selected Dot Popover Card */}
        {activeGraphDot && (
          <div className="p-3 bg-white border border-gray-300 rounded-xl shadow-md flex items-center justify-between animate-fadeIn max-w-md mx-auto">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full border border-slate-900 shrink-0 ${activeGraphDot.series === 'high' ? 'bg-[#FBBF24]' : 'bg-[#F43F5E]'}`} />
              <div>
                <h4 className="text-xs font-black text-gray-900">{activeGraphDot.student_name}</h4>
                <p className="text-[11px] text-gray-600">
                  {activeGraphDot.topic}: <strong className="text-gray-900 font-mono">{activeGraphDot.score}%</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveGraphDot(null)}
              className="text-gray-400 hover:text-gray-700 text-xs font-bold px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* SVG Math Grid Graph */}
        <div className="relative w-full overflow-x-auto">
          {/* Top Right Floating Legend Card matching Image 1 */}
          <div className="absolute top-2 right-4 bg-white/95 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-gray-300 shadow-md flex flex-col gap-1.5 text-xs z-10">
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded-full bg-[#EA580C]"></span>
              <span className="font-bold text-gray-800 text-[11px]">Cohort Mastery (%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-1.5 rounded-full bg-[#DB2777]"></span>
              <span className="font-bold text-gray-800 text-[11px]">Benchmark / Baseline (%)</span>
            </div>
          </div>

          <svg className="w-full h-auto min-w-[700px]" viewBox="0 0 800 350">
            <defs>
              <pattern id="math-grid-pattern" width="25" height="25" patternUnits="userSpaceOnUse">
                <path d="M 25 0 L 0 0 0 25" fill="none" stroke="#E2E8F0" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Grid Area with Gray Border */}
            <rect x="60" y="20" width="715" height="265" fill="url(#math-grid-pattern)" stroke="#94A3B8" strokeWidth="1" />

            {/* Horizontal Y-Lines & Labels */}
            {[100, 80, 60, 40, 20, 0].map(lvl => {
              const y = 20 + (100 - lvl) * 2.65;
              return (
                <g key={`y-${lvl}`}>
                  <line x1="60" y1={y} x2="775" y2={y} stroke="#CBD5E1" strokeWidth="1" />
                  <text x="50" y={y + 4} textAnchor="end" fontSize="11" fontWeight="600" fill="#64748B">{lvl}%</text>
                </g>
              );
            })}

            {/* Vertical X-Lines & Labels */}
            {studentsToPlot.map((st, idx) => {
              const x = 65 + (idx + 1) * stepX;
              return (
                <g key={`x-${idx}`}>
                  <line x1={x} y1="20" x2={x} y2="285" stroke="#CBD5E1" strokeWidth="1" />
                  <text x={x} y="306" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">{st.student_label || (`Student ${idx+1}`)}</text>
                  <text x={x} y="322" textAnchor="middle" fontSize="9" fontWeight="500" fill="#94A3B8">{(st.student_name || st.name)?.split(' ')[0]}</text>
                </g>
              );
            })}

            {/* Connecting Orange Curve Line (Cohort Top Mastery) */}
            <polyline
              fill="none"
              stroke="#EA580C"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polyHigh}
            />

            {/* Connecting Crimson Curve Line (Benchmark Baseline) */}
            <polyline
              fill="none"
              stroke="#DB2777"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polyLow}
            />

            {/* Gold Dots on Orange Line (Outlined with dark rim) */}
            {ptsHigh.map((pt, idx) => (
              <circle
                key={`dot-h-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r="6"
                fill="#FBBF24"
                stroke="#0F172A"
                strokeWidth="1.5"
                className="cursor-pointer hover:scale-125 transition-transform"
                onClick={() => setActiveGraphDot(pt)}
              />
            ))}

            {/* Pink Dots on Crimson Line (Outlined with dark rim) */}
            {ptsLow.map((pt, idx) => (
              <circle
                key={`dot-l-${idx}`}
                cx={pt.x}
                cy={pt.y}
                r="6"
                fill="#F43F5E"
                stroke="#0F172A"
                strokeWidth="1.5"
                className="cursor-pointer hover:scale-125 transition-transform"
                onClick={() => setActiveGraphDot(pt)}
              />
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#FAF8F5] text-[#111416] font-sans antialiased overflow-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-semibold transition-all transform animate-bounce ${
          toast.type === 'error' ? 'bg-[#93000A] text-white' : 'bg-[#003B1B] text-[#87C695] border border-emerald-500/30'
        }`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-white" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ===================== FIXED COLLAPSIBLE SIDEBAR ===================== */}
      <aside className={`h-full bg-[#0A0D0E] text-white flex flex-col justify-between transition-all duration-300 z-30 shrink-0 border-r border-[#22282C] ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } hidden md:flex`}>
        
        {/* Top Brand Logo matching Landing Page */}
        <div>
          <div className="h-20 flex items-center justify-between px-6 border-b border-[#22282C]">
            <div 
              onClick={() => handleNavClick('overview')} 
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#0A0D0E] border border-[#22282C] flex items-center justify-center text-[#FAF8F5] shadow-xs group-hover:scale-105 transition-transform shrink-0">
                <svg className="w-4.5 h-4.5 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M12 2.5V21.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" />
                  <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.4" />
                  <circle cx="12" cy="12" r="1.2" fill="#0DFA6C" />
                  <path d="M6 8.5L18 15.5M6 15.5L18 8.5" stroke="currentColor" strokeWidth="1" strokeOpacity="0.35" />
                </svg>
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-serif italic text-xl tracking-tight text-[#FAF8F5] font-medium">GapFinder</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-[#0A0D0E] text-[#FAF8F5] border border-[#22282C]">
                    {isTeacher ? 'FACULTY' : 'AI'}
                  </span>
                </div>
              )}
            </div>

            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#161A1D] transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items List */}
          <div className="px-3 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)] custom-scrollbar">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-3 text-[11px] font-bold text-gray-400 tracking-wider uppercase mb-2">
                    {group.section}
                  </p>
                )}
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 text-emerald-300 border-l-4 border-emerald-400 shadow-sm'
                          : 'text-gray-300 hover:text-white hover:bg-[#161A1D]'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-emerald-400' : 'text-gray-400 group-hover:text-emerald-300'
                        }`} />
                        {!sidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!sidebarCollapsed && item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.badgeColor || 'bg-[#003B1B] text-[#6BFF8F] border border-[#14532D]'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Student/Teacher Profile Card */}
        <div className="p-4 border-t border-[#22282C] bg-[#111416]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#003B1B] border border-[#14532D] flex items-center justify-center font-bold text-[#6BFF8F] text-sm">
                {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : (isTeacher ? 'FA' : 'AC')}
              </div>
              {!sidebarCollapsed && (
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white truncate">{currentUser?.name || (isTeacher ? 'Faculty Administrator' : 'Student')}</p>
                    {isTeacher && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono font-bold">
                        FACULTY
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{currentUser?.email || ''}</p>
                </div>
              )}
            </div>

            {!sidebarCollapsed && (
              <button 
                onClick={onLogout}
                className="p-1.5 text-gray-400 hover:text-[#BA1A1A] rounded-lg hover:bg-[#161A1D] transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ===================== MAIN CONTENT WRAPPER ===================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* ===================== TOP NAVIGATION BAR ===================== */}
        <header className="h-16 bg-white border-b border-[#E4DFD5] flex items-center justify-between px-6 shrink-0 z-20">
          
          {/* Left: Mobile hamburger & Breadcrumbs */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden text-gray-600 hover:text-black rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
              <span className="hover:text-black cursor-pointer" onClick={() => handleNavClick('overview')}>
                {isTeacher ? 'Faculty Portal' : 'GapFinder LMS'}
              </span>
              <span>/</span>
              <span className="text-[#003B1B] font-bold">
                {isTeacher 
                  ? (teacherActiveTab === 'overview' ? 'Dashboard' :
                     teacherActiveTab === 'students' ? 'Student Directory' :
                     teacherActiveTab === 'progress_graph' ? 'Cohort Progress (0-100%)' :
                     teacherActiveTab === 'weaker_students' ? 'Weaker Students Radar' :
                     teacherActiveTab === 'create_assignment' ? 'Create Assignment' :
                     (teacherActiveTab === 'submissions' || teacherActiveTab === 'assignments_submissions') ? 'Student Submissions' :
                     teacherActiveTab === 'history' ? 'Admin Audit History' : teacherActiveTab)
                  : activeTab.replace('_', ' ').replace('-', ' ')}
              </span>
            </div>
          </div>

          {/* Right: Search, Notifications, Role toggle, User avatar */}
          <div className="flex items-center gap-3">
            
            {/* Global Search Bar */}
            <div className="relative hidden lg:block w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder={isTeacher ? "Search students, topics, assignments..." : "Search topics, formulas, notes..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Teacher Role Pill (Omitted for Student Workspace to keep student header clean) */}
            {isTeacher && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-[#003B1B] border-[#064E3B] text-[#FAF8F5] shadow-xs">
                <span>👨‍🏫</span>
                <span className="font-bold">Faculty Portal</span>
              </div>
            )}

            {/* Quick Action Button */}
            {isTeacher ? (
              <button
                type="button"
                onClick={() => setTeacherActiveTab('create_assignment')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#003B1B] text-white hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden md:inline">New Assignment</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('assistant')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#003B1B] text-white hover:bg-emerald-800 transition-colors shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden md:inline">Ask Shubh AI</span>
              </button>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                className="relative p-2 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100"
              >
                <Bell className="w-4 h-4" />
                <span className="w-2 h-2 bg-[#BA1A1A] rounded-full ring-2 ring-white absolute top-1.5 right-1.5"></span>
              </button>

              {/* Notification Drawer */}
              {notifDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 z-50">
                  <div className="flex items-center justify-between border-b pb-2 mb-3">
                    <span className="text-xs font-bold uppercase text-gray-700">Notifications</span>
                    <span className="text-[10px] text-[#006E2F] font-semibold cursor-pointer">Mark all read</span>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100">
                      <p className="font-bold text-emerald-950">Assessment Evaluated</p>
                      <p className="text-gray-600 text-[11px] mt-0.5">Identified 2 critical gaps in course concepts.</p>
                      <span className="text-[10px] text-emerald-600 mt-1 block">15 minutes ago</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-gray-50 border border-gray-200">
                      <p className="font-bold text-gray-900">Revision Task Reminder</p>
                      <p className="text-gray-600 text-[11px] mt-0.5">Day 1: Concept Active Review (30 min estimated).</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">2 hours ago</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Student/Faculty Profile Avatar */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#003B1B] text-[#87C695] flex items-center justify-center font-bold text-xs shadow-sm">
                  {currentUser?.name ? currentUser.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase() : (isTeacher ? 'FA' : 'AC')}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900">{currentUser?.name || (isTeacher ? 'Faculty Administrator' : 'Student')}</p>
                    <p className="text-[11px] text-gray-500">{currentUser?.email || ''}</p>
                  </div>
                  {isTeacher ? (
                    <>
                      <button 
                        onClick={() => { setTeacherActiveTab('overview'); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-emerald-800 font-semibold hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-emerald-600" /> Cohort Overview
                      </button>
                      <button 
                        onClick={() => { setTeacherActiveTab('create_assignment'); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Assignment
                      </button>
                      <button 
                        onClick={() => { setTeacherActiveTab('history'); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" /> Admin Audit History
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => { setActiveTab('profile'); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-emerald-800 font-semibold hover:bg-emerald-50 flex items-center gap-2 cursor-pointer"
                      >
                        <User className="w-3.5 h-3.5 text-emerald-600" /> View Profile & Streaks
                      </button>
                      <button 
                        onClick={() => { setActiveTab('settings'); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5" /> Learning Preferences
                      </button>
                      <button 
                        onClick={() => { setActiveTab('materials'); setProfileDropdownOpen(false); }}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> My Ingested Materials
                      </button>
                    </>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    onClick={onLogout}
                    className="w-full text-left px-4 py-2 text-xs text-[#BA1A1A] hover:bg-[#FFDAD6]/30 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Logout
                  </button>
                </div>
              )}
            </div>

          </div>
        </header>

        {/* ===================== VIEW WORKSPACE (DYNAMIC BODY) ===================== */}
        <main ref={mainScrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
          
          {/* TEACHER COHORT VIEW (Strictly locked to Instructor Role) */}
          {isTeacher ? (
            <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
              {/* ===================== TAB 1: DASHBOARD ===================== */}
              {teacherActiveTab === 'overview' && (
                <div className="space-y-8 animate-fadeIn">
                  {/* Admin Caption Banner */}
                  <div className="bg-gradient-to-br from-[#0A0D0E] via-[#111416] to-[#003B1B] text-white p-6 sm:p-8 rounded-3xl border border-[#22282C] shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-1.5">
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-serif">
                        Faculty Dashboard
                      </h1>
                      <p className="text-sm text-emerald-100/80 leading-relaxed font-sans">
                        Real-time class analytics, student gap diagnosis, and curriculum-grounded assignments.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={async () => {
                          const token = getToken();
                          try {
                            const [ovRes, stRes, aRes, hRes, wRes, gRes] = await Promise.all([
                              fetch('/api/teacher/overview', { headers: { 'Authorization': `Bearer ${token}` } }),
                              fetch('/api/teacher/students', { headers: { 'Authorization': `Bearer ${token}` } }),
                              fetch('/api/teacher/assignments', { headers: { 'Authorization': `Bearer ${token}` } }),
                              fetch('/api/teacher/history', { headers: { 'Authorization': `Bearer ${token}` } }),
                              fetch('/api/teacher/weaker-students', { headers: { 'Authorization': `Bearer ${token}` } }),
                              fetch('/api/teacher/cohort-progress-graph', { headers: { 'Authorization': `Bearer ${token}` } })
                            ]);
                            if (ovRes.ok) setTeacherData(await ovRes.json());
                            if (stRes.ok) { const d = await stRes.json(); setTeacherStudentsList(d.students || []); }
                            if (aRes.ok) { const d = await aRes.json(); setTeacherAssignmentsList(d.assignments || []); }
                            if (hRes.ok) { const d = await hRes.json(); setAdminHistoryList(d.history || []); }
                            if (wRes.ok) { const d = await wRes.json(); setWeakerStudentsList(d.weaker_students || []); }
                            if (gRes.ok) setCohortGraphData(await gRes.json());
                            showToast('Telemetry refreshed in real time!');
                          } catch (e) {
                            showToast('Error refreshing data', 'error');
                          }
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
                      </button>
                    </div>
                  </div>

                  {/* 1. FIRST 3 KPI CARDS */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Card 1: Total Students */}
                    <div 
                      onClick={() => { setTeacherActiveTab('students'); if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0; }}
                      className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Students</span>
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#006E2F] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Users className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-3xl font-black text-gray-900">
                        {teacherData?.total_students || teacherStudentsList.length || 9}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                          Active registered cohort
                        </span>
                        <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 group-hover:underline">
                          View Directory →
                        </span>
                      </div>
                    </div>

                    {/* Card 2: Assignments */}
                    <div 
                      onClick={() => { setTeacherActiveTab('submissions'); if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0; }}
                      className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assignments</span>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <ClipboardCheck className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-3xl font-black text-gray-900">
                        {teacherData?.total_assignments || teacherAssignmentsList.length || 0}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
                          Published Quizzes & Papers
                        </span>
                        <span className="text-[11px] font-bold text-blue-800 flex items-center gap-1 group-hover:underline">
                          View Attempts →
                        </span>
                      </div>
                    </div>

                    {/* Card 3: Analytics */}
                    <div 
                      onClick={() => { setTeacherActiveTab('progress_graph'); if (mainScrollRef.current) mainScrollRef.current.scrollTop = 0; }}
                      className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-2 hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Analytics</span>
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-gray-900">
                          {teacherData?.overall_class_mastery || 65}%
                        </span>
                        <span className="text-xs text-gray-500 font-medium">Cohort Mean Mastery</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded inline-block">
                          Benchmark: ≥75%
                        </span>
                        <span className="text-[11px] font-bold text-amber-800 flex items-center gap-1 group-hover:underline">
                          Open Telemetry Graph →
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. STUDENT DIRECTORY TABULAR VIEW */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-base text-gray-900">Enrolled Student Cohort Registry</h3>
                      </div>
                      <span className="text-xs font-bold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 shrink-0">
                        {teacherStudentsList.length || 9} Students Listed
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">S.No</th>
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4">Institutional Email</th>
                            <th className="py-3 px-4">Materials Uploaded</th>
                            <th className="py-3 px-4">Topics Studied</th>
                            <th className="py-3 px-4">Average Mastery</th>
                            <th className="py-3 px-4 text-center">Inspect Material</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {teacherStudentsList.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-gray-400">Loading student registry...</td>
                            </tr>
                          ) : (
                            teacherStudentsList.map((st, idx) => (
                              <tr key={st.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-gray-500">{st.s_no || idx + 1}</td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-gray-900 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#006E2F] text-[10px] font-bold flex items-center justify-center">
                                      {st.name.charAt(0)}
                                    </div>
                                    <span>{st.name}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-gray-600">{st.email}</td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-800">
                                    {st.materials_count || 1} Document(s)
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-semibold text-gray-700">
                                    {st.topics_count || 7} Topics
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    (st.average_mastery || 60) >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                    (st.average_mastery || 60) >= 50 ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {st.average_mastery || 60}%
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEyeModal(st.id)}
                                    title={`View materials and topics for ${st.name}`}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#003B1B] rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-emerald-700" />
                                    <span className="text-[11px] font-bold">Summary</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* 3. COHORT PROGRESS GRAPH (IMAGE 1 REPLICA WITH MATH GRID PAPER) */}
                  {renderMathGridProgressChart()}

                  {/* 4. WEAKER STUDENTS SECTION */}
                  <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-3">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">Weaker Students & Specific Gap Topics (&lt;50%)</h3>
                      </div>
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 shrink-0">
                        {weakerStudentsList.length} At-Risk Incident(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {weakerStudentsList.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-semibold">
                          🎉 Excellent! No students currently fall below the 50% mastery threshold.
                        </div>
                      ) : (
                        weakerStudentsList.map((ws, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-2 hover:bg-white transition-all">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 text-xs">{ws.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-red-100 text-red-800 border border-red-200">
                                {ws.severity || 'Critical Deficit'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-700 font-semibold">Deficit Topic: <strong className="text-red-700">{ws.topic}</strong></span>
                              <span className="font-mono font-bold text-red-600 text-sm">{ws.score}%</span>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed italic bg-white p-2 rounded border border-red-100">
                              "{ws.recommended_action || `Review foundational prerequisites on ${ws.topic}.`}"
                            </p>
                            <div className="pt-1 flex justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  const token = getToken();
                                  const res = await fetch('/api/teacher/broadcast-drill', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ topic: ws.topic, message: `Instructor assigned targeted remedial drill for ${ws.topic}.` })
                                  });
                                  if (res.ok) {
                                    showToast(`Remedial drill assigned to ${ws.name} on ${ws.topic}!`);
                                  }
                                }}
                                className="px-3 py-1 bg-[#003B1B] hover:bg-emerald-900 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Assign Drill
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB 2: STUDENT DIRECTORY ===================== */}
              {teacherActiveTab === 'students' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-xl font-black text-gray-900">Student Cohort Directory</h1>
                    </div>
                    <span className="text-xs font-semibold text-gray-700 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shrink-0">
                      {teacherStudentsList.length || 9} Students Listed
                    </span>
                  </div>

                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">S.No</th>
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4">Institutional Email</th>
                            <th className="py-3 px-4">Materials Uploaded</th>
                            <th className="py-3 px-4">Topics Studied</th>
                            <th className="py-3 px-4">Average Mastery</th>
                            <th className="py-3 px-4 text-center">Inspect Material</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {teacherStudentsList.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-gray-400">Loading student registry...</td>
                            </tr>
                          ) : (
                            teacherStudentsList.map((st, idx) => (
                              <tr key={st.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-gray-500">{st.s_no || idx + 1}</td>
                                <td className="py-3.5 px-4">
                                  <div className="font-bold text-gray-900 flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#006E2F] text-[10px] font-bold flex items-center justify-center">
                                      {st.name.charAt(0)}
                                    </div>
                                    <span>{st.name}</span>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 font-mono text-gray-600">{st.email}</td>
                                <td className="py-3.5 px-4">
                                  <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-800">
                                    {st.materials_count || 1} Document(s)
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className="font-semibold text-gray-700">
                                    {st.topics_count || 7} Topics
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                    (st.average_mastery || 60) >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                    (st.average_mastery || 60) >= 50 ? 'bg-amber-100 text-amber-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {st.average_mastery || 60}%
                                  </span>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEyeModal(st.id)}
                                    title={`View materials and topics for ${st.name}`}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#003B1B] rounded-lg border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Eye className="w-4 h-4 text-emerald-700" />
                                    <span className="text-[11px] font-bold">Summary</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB 3: COHORT PROGRESS GRAPH ===================== */}
              {teacherActiveTab === 'progress_graph' && (
                <div className="space-y-6 animate-fadeIn">
                  {renderMathGridProgressChart()}
                </div>
              )}

              {/* ===================== TAB 4: WEAKER STUDENTS SECTION ===================== */}
              {teacherActiveTab === 'weaker_students' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-red-100 pb-3">
                      <div>
                        <h2 className="text-base font-bold text-gray-900">Weaker Students & Specific Gap Topics (&lt;50%)</h2>
                      </div>
                      <span className="text-xs font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 shrink-0">
                        {weakerStudentsList.length} At-Risk Incident(s)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {weakerStudentsList.length === 0 ? (
                        <div className="col-span-full p-8 text-center bg-emerald-50/50 rounded-xl border border-emerald-200 text-emerald-900 text-xs font-semibold">
                          🎉 Excellent! No students currently fall below the 50% mastery threshold.
                        </div>
                      ) : (
                        weakerStudentsList.map((ws, idx) => (
                          <div key={idx} className="p-4 rounded-xl border border-red-200 bg-red-50/30 space-y-2 hover:bg-white transition-all">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-gray-900 text-xs">{ws.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase bg-red-100 text-red-800 border border-red-200">
                                {ws.severity || 'Critical Deficit'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-gray-700 font-semibold">Deficit Topic: <strong className="text-red-700">{ws.topic}</strong></span>
                              <span className="font-mono font-bold text-red-600 text-sm">{ws.score}%</span>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed italic bg-white p-2 rounded border border-red-100">
                              "{ws.recommended_action || `Review foundational prerequisites on ${ws.topic}.`}"
                            </p>
                            <div className="pt-1 flex justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  const token = getToken();
                                  const res = await fetch('/api/teacher/broadcast-drill', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                    body: JSON.stringify({ topic: ws.topic, message: `Instructor assigned targeted remedial drill for ${ws.topic}.` })
                                  });
                                  if (res.ok) {
                                    showToast(`Remedial drill assigned to ${ws.name} on ${ws.topic}!`);
                                  }
                                }}
                                className="px-3 py-1 bg-[#003B1B] hover:bg-emerald-900 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Assign Drill
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB 2: CREATE ASSIGNMENT (QUIZ OR QUESTION PAPER) ===================== */}
              {teacherActiveTab === 'create_assignment' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6 max-w-4xl mx-auto">
                  <div className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-gray-900">Create Assignment</h2>
                    </div>
                  </div>

                  <form onSubmit={handleCreateAssignment} className="space-y-5 text-left text-xs">
                    {/* Toggle: Quiz vs Question Paper */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-2 uppercase tracking-wider">
                        Assignment Format Toggle
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setAssignmentForm({ ...assignmentForm, assignment_type: 'quiz' })}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            assignmentForm.assignment_type === 'quiz'
                              ? 'bg-emerald-50/80 border-[#003B1B] ring-2 ring-[#003B1B]/20 shadow-xs'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900">Adaptive Quiz</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">30 Mins</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 font-normal">
                            <strong>30 MCQs</strong> (Easy to Medium). Auto-graded instantaneously against calibrated answer keys.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setAssignmentForm({ ...assignmentForm, assignment_type: 'question_paper' })}
                          className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                            assignmentForm.assignment_type === 'question_paper'
                              ? 'bg-emerald-50/80 border-[#003B1B] ring-2 ring-[#003B1B]/20 shadow-xs'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm text-gray-900">Question Paper</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">45 Mins</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 font-normal">
                            <strong>10 Analytical Questions</strong> (Easy to Medium, 10 marks each = 100 marks total).
                          </p>
                        </button>
                      </div>
                    </div>

                    {/* Assignment Title & Topic */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Assignment Title *</label>
                        <input
                          type="text"
                          required
                          value={assignmentForm.title}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                          placeholder="e.g. Unit 2 Comprehensive Rank-Nullity Assessment"
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-black"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Target Topic *</label>
                        <input
                          type="text"
                          required
                          value={assignmentForm.topic}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, topic: e.target.value })}
                          placeholder="e.g. Core Topic or Uploaded Chapter"
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-1 focus:ring-black"
                        />
                      </div>
                    </div>

                    {/* Scheduled Date & Time Window */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Scheduled Start Date & Time *</label>
                        <input
                          type="datetime-local"
                          required
                          value={assignmentForm.start_time}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, start_time: e.target.value })}
                          className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                        />
                        <span className="text-[10px] text-gray-500 mt-1 block">Students cannot attempt before this time.</span>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Scheduled End Date & Time (Close Time) *</label>
                        <input
                          type="datetime-local"
                          required
                          value={assignmentForm.end_time}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, end_time: e.target.value })}
                          className="w-full p-2 bg-white border border-gray-300 rounded-lg text-xs"
                        />
                        <span className="text-[10px] text-gray-500 mt-1 block">Assignment automatically expires after this time.</span>
                      </div>
                    </div>

                    {/* Faculty Name & Subject */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Faculty Name (Optional)</label>
                        <input
                          type="text"
                          value={assignmentForm.faculty_name}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, faculty_name: e.target.value })}
                          placeholder="e.g. Dr. Elena Rostova"
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Subject (Optional)</label>
                        <input
                          type="text"
                          value={assignmentForm.subject}
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, subject: e.target.value })}
                          placeholder="e.g. Foundational STEM & Multivariable Systems"
                          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                        />
                      </div>
                    </div>

                    {/* Document Upload */}
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Upload Grounding Document (PDF / DOCX / TXT / MD) *</label>
                      <div className="p-5 border-2 border-dashed border-gray-300 rounded-xl text-center bg-gray-50 hover:bg-emerald-50/30 hover:border-emerald-500 transition-colors">
                        <input
                          type="file"
                          id="teacher-doc-upload"
                          accept=".pdf,.docx,.txt,.md"
                          onChange={(e) => setAssignmentForm({ ...assignmentForm, file: e.target.files?.[0] || null })}
                          className="hidden"
                        />
                        <label htmlFor="teacher-doc-upload" className="cursor-pointer block space-y-1">
                          <Upload className="w-6 h-6 text-gray-400 mx-auto" />
                          <span className="text-xs font-bold text-emerald-800 block">
                            {assignmentForm.file ? assignmentForm.file.name : "Click to select chapter, syllabus, or past paper document"}
                          </span>
                          <span className="text-[10px] text-gray-400 block">
                            {assignmentForm.file ? `${Math.round(assignmentForm.file.size / 1024)} KB · Ready for AI Grounding` : "Supports PDF, DOCX, TXT, MD up to 25 MB"}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={assignmentCreating}
                        className="w-full py-3 bg-[#003B1B] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {assignmentCreating ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                            <span>Grounding Questions in Uploaded Document & Publishing to All Students...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span>Generate & Publish to All Students in Real Time</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ===================== TAB 3: STUDENT SUBMISSIONS & ATTEMPTS ===================== */}
              {teacherActiveTab === 'submissions' && (
                <div className="space-y-6">
                  {/* Assignment Selector & Filter Bar */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-base font-bold text-gray-900">Student Attempts & Evaluation Telemetry</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Filter by Highest to Lowest (%) or Lowest to Highest (%) score.</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Assignment Selector */}
                      <select
                        onChange={(e) => {
                          const aid = parseInt(e.target.value);
                          const target = teacherAssignmentsList.find(a => a.id === aid);
                          if (target) handleViewSubmissions(target, submissionsSort);
                        }}
                        value={selectedAssignmentForSubmissions?.id || ''}
                        className="p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl font-bold"
                      >
                        <option value="">Select Assignment to View Submissions</option>
                        {teacherAssignmentsList.map(a => (
                          <option key={a.id} value={a.id}>
                            {a.title} ({a.assignment_type.toUpperCase()} · {a.submissions_count} attempts)
                          </option>
                        ))}
                      </select>

                      {/* Sort Filter: High-to-Low vs Low-to-High */}
                      {selectedAssignmentForSubmissions && (
                        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleViewSubmissions(selectedAssignmentForSubmissions, 'high_to_low')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              submissionsSort === 'high_to_low' ? 'bg-[#003B1B] text-white shadow-xs' : 'text-gray-600 hover:text-black'
                            }`}
                          >
                            Highest % First
                          </button>
                          <button
                            type="button"
                            onClick={() => handleViewSubmissions(selectedAssignmentForSubmissions, 'low_to_high')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              submissionsSort === 'low_to_high' ? 'bg-[#003B1B] text-white shadow-xs' : 'text-gray-600 hover:text-black'
                            }`}
                          >
                            Lowest % First
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submissions Table */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="py-3 px-4">S.No</th>
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Percentage Score</th>
                            <th className="py-3 px-4">Attempt Time / Date</th>
                            <th className="py-3 px-4">Time Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {!assignmentSubmissionsData || assignmentSubmissionsData.submissions?.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="py-12 text-center text-gray-400">
                                {teacherAssignmentsList.length === 0
                                  ? "No assignments created yet. Create a Quiz or Question Paper to view student submissions."
                                  : (selectedAssignmentForSubmissions
                                      ? "No students have attempted this assignment yet."
                                      : "Select an assignment from the dropdown above to view student submission records.")
                                }
                              </td>
                            </tr>
                          ) : (
                            assignmentSubmissionsData.submissions.map((sub, idx) => (
                              <tr key={sub.id || idx} className="hover:bg-emerald-50/40 transition-colors">
                                <td className="py-3 px-4 font-mono font-bold text-gray-500">{sub.s_no || idx + 1}</td>
                                <td className="py-3 px-4 font-bold text-gray-900">{sub.student_name}</td>
                                <td className="py-3 px-4 font-mono text-gray-600">{sub.student_email}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-1 rounded text-xs font-black font-mono ${
                                    sub.percentage >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                    sub.percentage >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {sub.percentage}% ({sub.score}/{sub.total_marks})
                                  </span>
                                </td>
                                <td className="py-3 px-4 font-mono text-gray-500">{sub.submitted_at}</td>
                                <td className="py-3 px-4 font-semibold text-gray-700">{sub.time_spent_formatted || `${sub.time_spent_seconds}s`}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Analytics Summary below Table */}
                    {assignmentSubmissionsData?.analytics && (
                      <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between text-xs gap-3">
                        <span className="text-gray-600">Total Attempts: <strong>{assignmentSubmissionsData.total_attempted}</strong></span>
                        <span className="text-gray-600">Average Percentage: <strong className="text-emerald-700">{assignmentSubmissionsData.analytics.average_percentage}%</strong></span>
                        <span className="text-gray-600">Highest Score: <strong className="text-emerald-700">{assignmentSubmissionsData.analytics.highest_percentage}%</strong></span>
                        <span className="text-gray-600">Lowest Score: <strong className="text-red-700">{assignmentSubmissionsData.analytics.lowest_percentage}%</strong></span>
                        <span className="text-gray-600">Pass Rate (≥50%): <strong className="text-blue-700">{assignmentSubmissionsData.analytics.pass_rate_pct}%</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===================== TAB 4: ADMIN HISTORY & AUDIT TRAIL ===================== */}
              {teacherActiveTab === 'history' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
                  <div className="border-b border-gray-100 pb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-900 px-2.5 py-0.5 rounded-full border border-purple-200">
                        Admin Audit Log
                      </span>
                      <h2 className="text-lg font-bold text-gray-900">Separate Admin History & Real-Time Action Log</h2>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Chronological ledger tracking quizzes created, question papers ready, and student submissions in real time. Zero simulated data.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {adminHistoryList.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-xs">No admin history records logged yet.</div>
                    ) : (
                      adminHistoryList.map((h, idx) => (
                        <div key={h.id || idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-white transition-all space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>{h.title}</span>
                            </span>
                            <span className="text-[10px] font-mono text-gray-400">{h.created_at}</span>
                          </div>
                          <p className="text-gray-600 pl-4">{h.details}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* ===================== FLOATING EYE MODAL CARD (STUDENT MATERIAL SUMMARY) ===================== */}
              {eyeModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded">
                          Student Material Inspection
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">
                          {selectedStudentForEyeModal?.student_name || "Student Materials Summary"}
                        </h3>
                        <p className="text-xs text-gray-500 font-mono">
                          {selectedStudentForEyeModal?.student_email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setEyeModalOpen(false); setSelectedStudentForEyeModal(null); }}
                        className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {eyeModalLoading ? (
                      <div className="py-12 text-center text-xs text-gray-500">Loading student uploaded materials and active topics...</div>
                    ) : (
                      <div className="space-y-4 text-xs">
                        {/* Summary Metrics */}
                        <div className="grid grid-cols-3 gap-3 text-center">
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Documents</span>
                            <span className="text-lg font-bold text-gray-900">{selectedStudentForEyeModal?.total_documents || 1}</span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Total Pages</span>
                            <span className="text-lg font-bold text-gray-900">{selectedStudentForEyeModal?.total_pages || 23}</span>
                          </div>
                          <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">Active Gap Topics</span>
                            <span className="text-lg font-bold text-emerald-700">{selectedStudentForEyeModal?.active_topics?.length || 7}</span>
                          </div>
                        </div>

                        {/* List of Documents Uploaded */}
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Uploaded Materials Summary & Topics in Use:</h4>
                          <div className="space-y-2.5">
                            {(selectedStudentForEyeModal?.materials || []).map((m, idx) => (
                              <div key={idx} className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-gray-900 flex items-center gap-1.5">
                                    <FileText className="w-4 h-4 text-emerald-700" />
                                    <span>{m.title}</span>
                                  </span>
                                  <span className="text-[10px] text-gray-400 font-mono">{m.uploaded_at}</span>
                                </div>
                                <div className="text-[11px] text-gray-600 flex items-center gap-3">
                                  <span>Subject: <strong>{m.subject}</strong></span>
                                  <span>•</span>
                                  <span>Pages: <strong>{m.page_count}</strong></span>
                                  <span>•</span>
                                  <span>Size: <strong>{Math.round(m.file_size / 1024)} KB</strong></span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Topics Extracted & In Use:</span>
                                  <div className="flex flex-wrap gap-1">
                                    {(m.topics_list || []).map((top, tIdx) => (
                                      <span key={tIdx} className="bg-white border border-gray-200 px-2 py-0.5 rounded text-[10px] font-medium text-gray-800">
                                        {top}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Active Knowledge Gaps */}
                        {selectedStudentForEyeModal?.active_topics?.length > 0 && (
                          <div>
                            <h4 className="font-bold text-gray-900 mb-2">Active Topic Mastery Scores:</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {selectedStudentForEyeModal.active_topics.map((top, tIdx) => (
                                <div key={tIdx} className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                                  <span className="font-medium text-gray-800 truncate pr-2">{top.topic}</span>
                                  <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                                    top.score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                                    top.score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {top.score}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="max-w-7xl mx-auto space-y-8">

              {/* REAL-TIME FACULTY ASSIGNMENTS STRIP (WITH NOTIFICATION BADGE) */}
              {studentAssignmentsList.length > 0 && (
                <div className="bg-white rounded-3xl border border-emerald-300 p-6 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                          Course Assignments Assigned by Faculty
                        </span>
                        {pendingStudentAssignmentsCount > 0 && (
                          <span className="text-[10px] font-black bg-red-500 text-white px-2 py-0.5 rounded-full animate-bounce">
                            {pendingStudentAssignmentsCount} New
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-gray-900 mt-1">Grounding Quizzes & Question Papers</h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {studentAssignmentsList.map((a, idx) => (
                      <div key={a.id || idx} className="p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:border-emerald-400 transition-all space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900 text-sm">{a.title}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            a.assignment_type === 'quiz' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {a.assignment_type === 'quiz' ? 'Quiz (30 MCQs · 30m)' : 'Question Paper (10 Qs · 45m)'}
                          </span>
                        </div>

                        <p className="text-gray-600">
                          Topic: <strong className="text-gray-900">{a.topic}</strong> · Faculty: <strong>{a.faculty_name}</strong>
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{a.time_status_label}</span>
                          </span>
                          {a.has_submitted && (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Attempted · {a.submission?.percentage}%
                            </span>
                          )}
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-gray-100">
                          {a.has_submitted ? (
                            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 w-full justify-between">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Attempted · Score: {a.submission?.percentage}% ({a.submission?.score}/{a.submission?.total_marks})</span>
                              </span>
                              <span className="text-[10px] uppercase font-semibold text-gray-500">Locked</span>
                            </div>
                          ) : a.can_attempt ? (
                            <button
                              type="button"
                              onClick={() => handleStartStudentAssignment(a)}
                              className="px-4 py-2 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform hover:scale-[1.02]"
                            >
                              <Play className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Start Assignment ({a.duration_minutes} Mins)</span>
                            </button>
                          ) : a.is_upcoming ? (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                              🔒 Opens at scheduled time
                            </span>
                          ) : (
                            <span className="text-gray-400 font-semibold bg-gray-100 px-2.5 py-1 rounded-md">
                              Assignment Expired
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Bespoke Luxury Welcome Card */}
              {(() => {
                const totalTopicsCount = dashboardData?.metrics?.total_topics ?? 0;
                const activeGapsCount = dashboardData?.metrics?.critical_gaps_count ?? 
                  (dashboardData?.gaps?.filter(g => (g.mastery_score ?? 100) < 70).length ?? 0);
                const dynamicRevisionDays = dashboardData?.metrics?.revision_days_needed ?? (activeGapsCount > 0 ? Math.min(7, Math.max(3, activeGapsCount + 2)) : 0);

                return (
                  <div className="bg-gradient-to-br from-[#0A0D0E] via-[#111416] to-[#003B1B] text-white p-6 sm:p-8 md:p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.25)] border border-[#22282C] relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative z-10 max-w-2xl space-y-3">
                      <div className="inline-flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-emerald-300 bg-white/10 px-3 py-1 rounded-full border border-emerald-400/20 backdrop-blur-xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Academic Learning Workspace · {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white font-serif">
                        Welcome back, {currentUser?.name?.split(' ')[0] || 'Scholar'}.
                      </h1>

                      <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed font-sans">
                        {totalTopicsCount === 0 ? (
                          <>Welcome to your personalized diagnostic workspace. Complete your first assessment to evaluate concept mastery and generate an evidence-grounded revision plan.</>
                        ) : activeGapsCount > 0 ? (
                          <>GapFinder AI identified <strong className="text-emerald-300 font-bold underline decoration-[#6BFF8F]/50 underline-offset-4">{activeGapsCount} critical knowledge gap(s)</strong> in your active curriculum. We built an adaptive <strong className="text-white font-bold">{dynamicRevisionDays}-day plan</strong> to close them before your exam.</>
                        ) : (
                          <>All assessed topics meet or exceed the mastery threshold! Continue practice drills to maintain concept retention.</>
                        )}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          onClick={() => setActiveTab('revision')}
                          className="flex items-center gap-2 px-5 py-2.5 bg-[#6BFF8F] hover:bg-[#5CE67E] text-[#00210D] font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-transform hover:scale-105"
                        >
                          <Calendar className="w-4 h-4 text-[#00210D]" />
                          <span>View Revision Plan</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('practice')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors"
                        >
                          <Zap className="w-4 h-4 text-emerald-300" />
                          <span>Practice Drill</span>
                        </button>

                        <button
                          onClick={() => setActiveTab('assistant')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#003B1B] hover:bg-[#14532D] text-white font-bold text-xs rounded-xl border border-[#14532D] transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                          <span>Ask Shubh AI</span>
                        </button>
                      </div>
                    </div>

                    {/* Rich Unique Card Visual / Hero Graphic */}
                    <div className="relative z-10 shrink-0 hidden lg:flex items-center justify-center">
                      <div className="relative w-44 h-44 rounded-3xl bg-gradient-to-tr from-[#003B1B]/40 to-[#14532D]/20 p-1 border border-[#6BFF8F]/30 shadow-2xl backdrop-blur-sm flex items-center justify-center overflow-hidden">
                        <img 
                          src={heroImg} 
                          alt="Learning Workspace" 
                          className="w-full h-full object-cover rounded-[22px] opacity-90 hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0D0E]/80 via-transparent to-transparent pointer-events-none"></div>
                        <span className="absolute bottom-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-black/60 text-emerald-300 border border-emerald-400/30">
                          Active Scholar
                        </span>
                      </div>
                    </div>

                    {/* Subtle Ambient Glows */}
                    <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#003B1B]/30 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-[#6BFF8F]/10 rounded-full blur-3xl pointer-events-none"></div>
                  </div>
                );
              })()}

              {/* 4 Summary Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Overall Knowledge</span>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">
                      {(dashboardData?.metrics?.total_topics ?? 0) === 0 ? '—' : `${dashboardData?.metrics?.overall_knowledge_score ?? 0}%`}
                    </span>
                    <span className="text-xs font-bold text-emerald-600">
                      {(dashboardData?.metrics?.total_topics ?? 0) === 0 ? 'Not Assessed Yet' : 'Verified score'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#15803D] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(dashboardData?.metrics?.total_topics ?? 0) === 0 ? 0 : (dashboardData?.metrics?.overall_knowledge_score ?? 0)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Topics Mastered</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">{dashboardData?.metrics?.mastered_topics_count ?? 0}</span>
                    <span className="text-xs text-gray-400">of {dashboardData?.metrics?.total_topics ?? 0} total</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 truncate">
                    {(dashboardData?.metrics?.mastered_topics_count ?? 0) > 0 
                      ? (dashboardData?.knowledge_distribution?.strong?.map(s => s.topic || s).slice(0, 2).join(', ') || 'Concepts mastered')
                      : 'Take assessment to evaluate'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm hover:shadow-md transition-shadow border-[#FFDAD6] bg-[#FFDAD6]/15">
                  <div className="flex items-center justify-between text-[#BA1A1A] mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Critical Gaps</span>
                    <AlertTriangle className="w-4 h-4 text-[#BA1A1A]" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#BA1A1A]">{dashboardData?.metrics?.critical_gaps_count ?? 0}</span>
                    <span className="text-xs font-semibold text-[#BA1A1A]">
                      {(dashboardData?.metrics?.critical_gaps_count ?? 0) > 0 ? 'Urgent Remediation' : 'Clear'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#BA1A1A] mt-2 truncate">
                    {(dashboardData?.metrics?.critical_gaps_count ?? 0) > 0 
                      ? (dashboardData?.gaps?.filter(g => g.mastery_score < 50).map(g => g.topic).slice(0, 3).join(', ') || 'Identified deficits')
                      : 'No critical gaps active'}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between text-gray-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Revision Items</span>
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-gray-900">{dashboardData?.metrics?.revision_days_needed ?? 0}</span>
                    <span className="text-xs text-emerald-600 font-semibold">Active tasks queued</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2">Personalized daily remediation</p>
                </div>
              </div>

              {/* Main 2-Column Section: Weak Topics & Revision Tasks */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left 7 Cols: Critical Weak Topics */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-[#E4DFD5] shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-[#BA1A1A]" />
                          <span>Weak Topics Requiring Attention</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Evidence-grounded root causes detected from your assessment attempts</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('gaps')}
                        className="text-xs font-bold text-[#006E2F] hover:underline flex items-center gap-1"
                      >
                        Full Report <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {(dashboardData?.gaps?.filter(g => g.mastery_score < 80) || []).length === 0 ? (
                        <div className="p-8 text-center rounded-xl border border-dashed border-gray-200 bg-[#FAF8F5]">
                          <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                          <p className="text-sm font-bold text-gray-900">No Critical Gaps Active</p>
                          <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 mb-4">
                            {(dashboardData?.metrics?.total_topics ?? 0) > 0
                              ? "All your assessed topics meet or exceed the mastery threshold. Great work!"
                              : "You haven't completed any assessments yet. Start your first assessment to evaluate knowledge gaps."}
                          </p>
                          <button
                            onClick={() => setActiveTab('diagnostics')}
                            className="px-4 py-2 bg-[#003B1B] hover:bg-emerald-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all inline-flex items-center gap-1.5"
                          >
                            <Play className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Start Skill Assessment</span>
                          </button>
                        </div>
                      ) : (
                        dashboardData?.gaps?.filter(g => g.mastery_score < 80).map((gap) => (
                          <div key={gap.id} className="p-4 rounded-xl border border-gray-100 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all bg-white shadow-xs">
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                    gap.mastery_score < 50 ? 'bg-[#FFDAD6] text-[#BA1A1A]' : 'bg-[#F4EFE6] text-[#725B38]'
                                  }`}>
                                    {gap.mastery_score < 50 ? 'Critical Gap' : 'Needs Review'}
                                  </span>
                                  <span className="text-xs text-gray-400 font-medium">{gap.unit}</span>
                                </div>
                                <h3 className="text-sm font-bold text-gray-900">{gap.topic}</h3>
                                <p className="text-xs text-gray-600 leading-relaxed font-normal">
                                  <strong className="text-gray-800">Why you missed it: </strong>{gap.root_cause}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <span className={`text-base font-extrabold ${gap.mastery_score < 50 ? 'text-[#BA1A1A]' : 'text-[#725B38]'}`}>
                                  {gap.mastery_score}%
                                </span>
                                <p className="text-[10px] text-gray-400">Mastery</p>
                              </div>
                            </div>

                            {/* Blocked Prerequisites and Drill Action */}
                            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Blocks:</span>
                                {gap.blocked_prerequisites?.slice(0, 2).map((prereq, pIdx) => (
                                  <span key={pIdx} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                                    {prereq}
                                  </span>
                                ))}
                              </div>

                              <button
                                onClick={() => handleLaunchPractice(gap.topic)}
                                className="flex items-center gap-1.5 px-3 py-1 bg-[#003B1B] hover:bg-emerald-800 text-emerald-200 text-xs font-bold rounded-lg transition-colors"
                              >
                                <Play className="w-3 h-3 text-emerald-400" />
                                <span>2-Min Drill</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols: Upcoming Revision Schedule & Distribution */}
                <div className="lg:col-span-5 space-y-6">
                  
                  {/* Revision Tasks Mini Preview */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E4DFD5] shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span>Upcoming Revision Tasks</span>
                        </h2>
                        <p className="text-xs text-gray-500">Structured daily remediation</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('revision')}
                        className="text-xs font-bold text-[#006E2F] hover:underline"
                      >
                        All Tasks
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(!dashboardData?.revision_plan || dashboardData.revision_plan.length === 0) ? (
                        <div className="p-6 text-center rounded-xl border border-dashed border-gray-200 bg-[#FAF8F5]">
                          <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-gray-700">No Revision Tasks Scheduled</p>
                          <p className="text-[11px] text-gray-500 mt-1 max-w-xs mx-auto">
                            Complete a skill assessment to generate targeted, evidence-based daily revision tasks.
                          </p>
                        </div>
                      ) : (
                        dashboardData?.revision_plan?.slice(0, 3).map((task, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl border border-gray-100 bg-[#FAF8F5] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-100/60 text-[#006E2F] font-bold text-xs flex items-center justify-center shrink-0">
                                {task.day_number || idx + 1}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-900">{task.topic}</p>
                                <p className="text-[11px] text-gray-500">{task.estimated_minutes} min active practice</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              task.priority === 'High' ? 'bg-[#FFDAD6] text-[#BA1A1A]' : 'bg-[#E6F4EA] text-[#006E2F]'
                            }`}>
                              {task.priority}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Knowledge Distribution */}
                  <div className="bg-white p-6 rounded-2xl border border-[#E4DFD5] shadow-sm">
                    <h2 className="text-base font-bold text-gray-900 mb-1">Knowledge Distribution</h2>
                    <p className="text-xs text-gray-500 mb-4">Categorization based on verified assessment attempts</p>

                    {(() => {
                      const totalTopicsCount = dashboardData?.metrics?.total_topics ?? 0;
                      const strongCount = dashboardData?.knowledge_distribution?.strong?.length ?? 0;
                      const mediumCount = dashboardData?.knowledge_distribution?.medium?.length ?? 0;
                      const weakCount = dashboardData?.knowledge_distribution?.weak?.length ?? 0;
                      const strongPct = totalTopicsCount > 0 ? Math.round((strongCount / totalTopicsCount) * 100) : 0;
                      const mediumPct = totalTopicsCount > 0 ? Math.round((mediumCount / totalTopicsCount) * 100) : 0;
                      const weakPct = totalTopicsCount > 0 ? Math.round((weakCount / totalTopicsCount) * 100) : 0;

                      return (
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-[#006E2F]">Mastered (≥80%)</span>
                              <span>{strongCount} topics ({strongPct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#15803D] h-full rounded-full transition-all duration-500" style={{ width: `${strongPct}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-[#725B38]">In Progress (50–79%)</span>
                              <span>{mediumCount} topics ({mediumPct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#C2B8A3] h-full rounded-full transition-all duration-500" style={{ width: `${mediumPct}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span className="text-[#BA1A1A]">Critical Gaps (&lt;50%)</span>
                              <span>{weakCount} topics ({weakPct}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                              <div className="bg-[#BA1A1A] h-full rounded-full transition-all duration-500" style={{ width: `${weakPct}%` }}></div>
                            </div>
                          </div>

                          {totalTopicsCount === 0 && (
                            <p className="text-[11px] text-gray-400 italic text-center pt-2">
                              Assessment evaluation required to populate mastery distribution.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MY MATERIALS — STUDY MATERIAL INGESTION & KNOWLEDGE EXTRACTION */}
          {activeTab === 'materials' && (
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div className="border-b border-[#E4DFD5] pb-5">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Study Materials & Course Library</h1>
              </div>

              {/* Unified Intuitive Drag & Drop Ingestion Card */}
              <label 
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload({ target: { files: e.dataTransfer.files } });
                  }
                }}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20 rounded-2xl p-8 sm:p-10 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 shadow-xs group"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 group-hover:scale-105 flex items-center justify-center text-[#006E2F] shadow-sm mb-3 transition-transform">
                  <Upload className="w-8 h-8 text-[#006E2F]" />
                </div>
                <h3 className="font-extrabold text-base text-gray-900 group-hover:text-emerald-950">
                  {uploadingDoc ? 'Ingesting and Processing Document...' : 'Drag and drop your study materials, or click to browse'}
                </h3>
                <p className="text-xs text-gray-500 max-w-md mt-1 mb-2 font-medium">
                  Supports PDF, DOCX, Markdown, and TXT files (up to 50MB). Structured with automated section & topic tracking.
                </p>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-full border border-emerald-300">
                  Browse from computer
                </span>
                <input 
                  type="file" 
                  accept=".pdf,.docx,.txt,.md" 
                  onChange={handleFileUpload}
                  disabled={uploadingDoc}
                  className="hidden" 
                />
              </label>

              {/* Ingested Documents Table */}
              <div className="bg-white rounded-2xl border border-[#E4DFD5] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900">Ingested Course Materials ({documentsList.length})</h2>
                  <span className="text-xs text-[#006E2F] font-semibold">Active Syllabus Library</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF8F5] text-gray-500 border-b border-gray-100 font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="py-3.5 px-5">Document Title</th>
                        <th className="py-3.5 px-4">Type</th>
                        <th className="py-3.5 px-4">Pages</th>
                        <th className="py-3.5 px-4">Indexed Topics</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {documentsList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-gray-500">
                            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-bold text-gray-800">No study materials ingested yet</p>
                            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
                              Upload your course syllabus, lecture slides, or textbook chapters in PDF, DOCX, or TXT format above to begin retrieval-grounded learning.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        documentsList.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006E2F] flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{doc.title}</p>
                                <p className="text-[11px] text-gray-400">{doc.subject}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-600">
                            <span className="px-2.5 py-1 rounded-md bg-gray-100 text-gray-700">
                              {doc.doc_type}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 font-medium">{doc.page_count} pgs</td>
                          <td className="py-4 px-4 text-gray-600 font-medium">{doc.topics_count || 12} topics</td>
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#006E2F] border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {doc.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-right space-x-2">
                            <button
                              onClick={() => handlePreviewDoc(doc.id)}
                              className="p-1.5 text-gray-500 hover:text-[#006E2F] rounded-lg hover:bg-gray-100"
                              title="Preview Chunks & Text"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1.5 text-gray-400 hover:text-[#BA1A1A] rounded-lg hover:bg-gray-100"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Preview Document Modal */}
              {previewDocModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-3xl w-full max-h-[85vh] flex flex-col">
                    <div className="p-5 border-b flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-base text-gray-900">{previewDocModal.title}</h3>
                        <p className="text-xs text-gray-500">Extracted Concepts & Vector Grounding Sample</p>
                      </div>
                      <button onClick={() => setPreviewDocModal(null)} className="p-1.5 text-gray-400 hover:text-black">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
                      {previewDocModal.preview_chunks?.map((chk) => (
                        <div key={chk.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between text-gray-500 font-mono text-[11px]">
                            <span className="font-bold text-emerald-800">Page {chk.page_number} · {chk.section_title}</span>
                            <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">{chk.topic}</span>
                          </div>
                          <p className="text-gray-800 leading-relaxed font-sans">{chk.source_text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t flex justify-end">
                      <button 
                        onClick={() => setPreviewDocModal(null)}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-semibold"
                      >
                        Close Preview
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: AI SYLLABUS & TOPIC MAPPING TREE */}
          {activeTab === 'topics' && (
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4DFD5] pb-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Curriculum & Topic Map</h1>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 font-medium">
                    {topicMapData?.units?.length || 0} Units · {topicMapData?.units?.reduce((acc, u) => acc + (u.chapters?.reduce((cAcc, c) => cAcc + (c.topics?.length || 0), 0) || 0), 0)} Topics
                  </span>
                </div>
              </div>

              {/* Expandable Topic Tree or Empty State */}
              {(!topicMapData?.units || topicMapData.units.length === 0) ? (
                <div className="bg-white rounded-2xl border border-dashed border-[#E4DFD5] p-12 text-center space-y-4">
                  <Layers className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-gray-900">No Curriculum Uploaded Yet</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Upload your course syllabus, lecture notes, or textbook chapter in 'My Materials' to dynamically generate your grounded Topic Map.
                  </p>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className="px-5 py-2.5 bg-[#003B1B] text-white font-bold text-xs rounded-xl hover:bg-emerald-900 transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Go to My Materials</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                {topicMapData?.units?.map((unit) => {
                  const isExpanded = expandedUnits[unit.unit_id];
                  return (
                    <div key={unit.unit_id} className="bg-white rounded-2xl border border-[#E4DFD5] shadow-sm overflow-hidden">
                      {/* Unit Header */}
                      <div 
                        onClick={() => setExpandedUnits(prev => ({ ...prev, [unit.unit_id]: !prev[unit.unit_id] }))}
                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors select-none"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#006E2F] flex items-center justify-center font-bold text-xs">
                            {unit.unit_id}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-gray-900">{unit.name}</h3>
                            <p className="text-[11px] text-gray-500">Weight in exam: {unit.exam_weight}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-400">
                            {unit.chapters?.reduce((acc, c) => acc + c.topics.length, 0)} Topics
                          </span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                        </div>
                      </div>

                      {/* Chapters & Topics Body */}
                      {isExpanded && (
                        <div className="p-5 pt-0 border-t border-gray-100 bg-[#FAF8F5]/40 space-y-4">
                          {unit.chapters?.map((chapter) => (
                            <div key={chapter.chapter_id} className="space-y-3 pt-3">
                              <h4 className="text-xs font-bold text-gray-700 tracking-wider uppercase flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                                {chapter.chapter_id}: {chapter.title}
                              </h4>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {chapter.topics?.map((topic) => (
                                  <div key={topic.id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-xs hover:border-emerald-300 transition-all space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                      <div>
                                        <h5 className="font-bold text-sm text-gray-900">{topic.name}</h5>
                                        <p className="text-[11px] text-emerald-800 font-mono mt-0.5">{topic.concept}</p>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        topic.classification === 'Weak' ? 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFDAD6]' : (
                                          topic.classification === 'Medium' ? 'bg-[#F4EFE6] text-[#725B38] border border-[#E4DFD5]' : (
                                            topic.classification === 'Strong' ? 'bg-[#E6F4EA] text-[#006E2F] border border-[#A7E8BD]' : 'bg-gray-100 text-gray-600 border border-gray-200'
                                          )
                                        )
                                      }`}>
                                        {topic.mastery_score !== null && topic.mastery_score !== undefined
                                          ? `${topic.mastery_score}% · ${topic.classification}`
                                          : 'Not Assessed Yet'}
                                      </span>
                                    </div>

                                    {/* Grounding & Past Paper Tag */}
                                    <div className="text-[11px] text-gray-500 space-y-1">
                                      <p><strong>Source: </strong>{topic.grounding_citation}</p>
                                      <p><strong>Past Exam: </strong>{topic.past_paper_frequency}</p>
                                    </div>

                                    {/* Prerequisites */}
                                    {topic.blocked_prerequisites?.length > 0 && (
                                      <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
                                        <span className="text-gray-400 font-semibold">Blocks:</span>
                                        {topic.blocked_prerequisites.map((p, idx) => (
                                          <span key={idx} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                            {p}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* 1-Click Action */}
                                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                      <button
                                        onClick={() => {
                                          setAssistantTopic(topic.name);
                                          setActiveTab('assistant');
                                        }}
                                        className="text-[11px] text-[#006E2F] hover:underline font-bold flex items-center gap-1"
                                      >
                                        <Sparkles className="w-3 h-3" /> Ask Tutor
                                      </button>
                                      <button
                                        onClick={() => handleLaunchPractice(topic.name)}
                                        className="text-[11px] bg-emerald-50 hover:bg-emerald-100 text-[#003B1B] font-bold px-2.5 py-1 rounded-md transition-colors"
                                      >
                                        Practice Drill
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              )}

            </div>
          )}

          {/* TAB 4: SKILL ASSESSMENTS & ADAPTIVE EVALUATION RUNNER */}
          {activeTab === 'diagnostics' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* If no active test is running, show launcher */}
              {!activeAssessment && (
                <div className="bg-white rounded-2xl border border-[#E4DFD5] p-8 shadow-sm space-y-6">
                  <div className="border-b border-gray-100 pb-5">
                    <h1 className="text-2xl font-extrabold text-gray-900">Start Adaptive Concept Assessment</h1>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">Assessment Mode</label>
                      <select 
                        value={testMode} 
                        onChange={(e) => setTestMode(e.target.value)}
                        className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="Initial Diagnostic">Comprehensive Baseline Assessment</option>
                        <option value="Topic-specific Diagnostic">Topic-Specific Assessment</option>
                        <option value="Weak-topic Practice">Targeted Remediation Practice</option>
                        <option value="Revision Assessment">Revision Post-Test</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">Subject Scope</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={currentUser?.course || 'Foundational STEM & Computing'}
                        className="w-full p-2.5 text-xs bg-gray-100 border border-gray-200 rounded-xl text-gray-600 font-semibold cursor-not-allowed"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-2">
                        Target Question Count (Up to 30 MCQs Grounded in Uploaded Materials)
                      </label>
                      <div className="grid grid-cols-4 gap-2.5">
                        {[5, 10, 20, 30].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setDiagnosticCount(num)}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                              diagnosticCount === num
                                ? 'bg-black text-white border-black shadow-xs ring-2 ring-emerald-500/30'
                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <span>{num} MCQs</span>
                            {num === 30 && <span className="text-[10px] text-amber-300 font-extrabold">★ MAX</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs text-[#003B1B] space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-[#006E2F]" />
                      Assessment Integrity & Grounding Notice:
                    </p>
                    <p className="text-emerald-900/80 leading-relaxed">
                      Every question is grounded in your uploaded study materials and course syllabus. Submissions are evaluated by calibrated pedagogical rubrics.
                    </p>
                  </div>

                  <button
                    onClick={() => handleStartDiagnostic(testMode)}
                    className="w-full py-3.5 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2"
                  >
                    <Target className="w-4 h-4 text-emerald-400" />
                    <span>Begin Assessment</span>
                  </button>
                </div>
              )}

              {/* Active Assessment Live Runner */}
              {activeAssessment && !assessmentResults && (
                <div className="bg-white rounded-2xl border border-[#E4DFD5] shadow-lg overflow-hidden flex flex-col">
                  
                  {/* Top Header: Title, Question counter, Timer */}
                  <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FAF8F5]">
                    <div>
                      <span className="text-[11px] font-bold text-[#006E2F] uppercase">{activeAssessment.mode}</span>
                      <h2 className="text-base font-extrabold text-gray-900">{activeAssessment.title}</h2>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Timer */}
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 font-mono text-xs font-bold text-gray-800 shadow-xs">
                        <Clock className={`w-3.5 h-3.5 ${testTimer < 180 ? 'text-[#BA1A1A] animate-pulse' : 'text-emerald-600'}`} />
                        <span>{Math.floor(testTimer / 60)}:{String(testTimer % 60).padStart(2, '0')}</span>
                      </div>

                      <button
                        onClick={handleFinishTest}
                        disabled={submittingTest}
                        className="px-4 py-1.5 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors"
                      >
                        {submittingTest ? 'Evaluating...' : 'Submit Assessment'}
                      </button>
                    </div>
                  </div>

                  {/* Question Palette Strip */}
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 overflow-x-auto">
                    <span className="text-[11px] font-bold text-gray-500 uppercase mr-2">Questions:</span>
                    {activeAssessment.questions.map((q, idx) => {
                      const isCurrent = currentQuestionIndex === idx;
                      const isAnswered = userAnswers[q.id] !== undefined;
                      const isMarked = markedForReview[q.id];

                      let btnStyle = 'bg-white border-gray-200 text-gray-700';
                      if (isAnswered) btnStyle = 'bg-emerald-600 text-white border-emerald-600';
                      if (isMarked) btnStyle = 'bg-[#0A0D0E] text-[#6BFF8F] border-[#22282C]';
                      if (isCurrent) btnStyle += ' ring-2 ring-emerald-500 ring-offset-1 font-extrabold';

                      return (
                        <button
                          key={q.id}
                          onClick={() => setCurrentQuestionIndex(idx)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold border transition-all ${btnStyle}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Question Body */}
                  {activeAssessment.questions[currentQuestionIndex] && (() => {
                    const q = activeAssessment.questions[currentQuestionIndex];
                    return (
                      <div className="p-6 md:p-8 space-y-6">
                        
                        {/* Topic, Subtopic & Source Grounding Banner */}
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              {q.topic}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{q.unit}</span>
                            <span className="text-xs text-gray-400">• Marks: {q.marks}</span>
                          </div>

                          <h3 className="text-base md:text-lg font-bold text-gray-900 leading-snug">
                            {currentQuestionIndex + 1}. {q.question_text}
                          </h3>

                          {/* Grounding Source Chip */}
                          <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 font-mono">
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                            <span>Grounded in: {q.source_doc} (p. {q.source_page}, {q.source_section})</span>
                          </div>
                        </div>

                        {/* Options / Answer Input */}
                        {q.question_type === 'mcq' ? (
                          <div className="space-y-3 pt-2">
                            {q.options?.map((opt, optIdx) => {
                              const isSelected = userAnswers[q.id] === optIdx;
                              return (
                                <div
                                  key={optIdx}
                                  onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: optIdx }))}
                                  className={`p-4 rounded-xl border text-xs font-medium cursor-pointer transition-all flex items-start gap-3 ${
                                    isSelected 
                                      ? 'border-[#003B1B] bg-emerald-50/60 text-[#00210D] shadow-xs' 
                                      : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50 text-gray-800'
                                  }`}
                                >
                                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                    isSelected ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-300'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3" />}
                                  </div>
                                  <span className="leading-relaxed">{opt}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2 pt-2">
                            <textarea
                              rows={4}
                              placeholder="Write your brief conceptual explanation here..."
                              value={userAnswers[q.id] || ''}
                              onChange={(e) => setUserAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                              className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed font-sans"
                            />
                            <p className="text-[11px] text-gray-400">AI evaluation will check for foundational keywords and reasoning.</p>
                          </div>
                        )}

                        {/* Navigation Footer */}
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                          <button
                            onClick={() => setMarkedForReview(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              markedForReview[q.id] ? 'bg-[#F4EFE6] text-[#725B38] border border-[#E4DFD5]' : 'text-gray-500 hover:bg-gray-100'
                            }`}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>{markedForReview[q.id] ? 'Marked for Review' : 'Mark for Review'}</span>
                          </button>

                          <div className="flex items-center gap-3">
                            <button
                              disabled={currentQuestionIndex === 0}
                              onClick={() => setCurrentQuestionIndex(i => i - 1)}
                              className="px-4 py-2 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-50 disabled:opacity-30"
                            >
                              Previous
                            </button>
                            {currentQuestionIndex < activeAssessment.questions.length - 1 ? (
                              <button
                                onClick={() => setCurrentQuestionIndex(i => i + 1)}
                                className="px-5 py-2 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs"
                              >
                                Next
                              </button>
                            ) : (
                              <button
                                onClick={handleFinishTest}
                                disabled={submittingTest}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-[#00210D] font-extrabold text-xs rounded-xl shadow-md"
                              >
                                Finish & Evaluate
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                </div>
              )}

              {/* Assessment Results Screen */}
              {assessmentResults && (
                <div className="bg-white rounded-2xl border border-[#E4DFD5] p-8 shadow-xl space-y-6">
                  <div className="text-center space-y-2 border-b border-gray-100 pb-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#006E2F] flex items-center justify-center mx-auto shadow-md">
                      <Award className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-900">Assessment Complete</h2>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      {assessmentResults.report?.summary}
                    </p>
                    <div className="text-4xl font-extrabold text-[#003B1B] pt-2">
                      {assessmentResults.report?.overall_score}%
                    </div>
                  </div>

                  {/* Evaluated Questions Breakdown */}
                  <div className="space-y-4">
                    <h3 className="font-bold text-sm text-gray-900">Question Evaluation & Source Citations</h3>
                    {assessmentResults.evaluations?.map((ev, idx) => (
                      <div key={idx} className={`p-4 rounded-xl border text-xs space-y-2 ${
                        ev.is_correct ? 'bg-[#E6F4EA]/40 border-[#A7E8BD]' : 'bg-[#FFDAD6]/30 border-[#FFDAD6]'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-800">Q{idx + 1}: {ev.topic}</span>
                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                            ev.is_correct ? 'bg-[#E6F4EA] text-[#006E2F]' : 'bg-[#FFDAD6] text-[#BA1A1A]'
                          }`}>
                            {ev.is_correct ? 'Correct' : 'Needs Review'}
                          </span>
                        </div>
                        <p className="text-gray-900 font-medium">{ev.question_text}</p>
                        <p className="text-gray-600"><strong className="text-gray-800">Explanation: </strong>{ev.explanation}</p>
                        <p className="text-[11px] text-emerald-800 font-mono">Grounded: {ev.grounding_source}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 flex items-center justify-between">
                    <button
                      onClick={() => { setActiveAssessment(null); setAssessmentResults(null); }}
                      className="px-4 py-2 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl"
                    >
                      Close Assessment
                    </button>
                    <button
                      onClick={() => setActiveTab('gaps')}
                      className="px-5 py-2.5 bg-[#003B1B] text-white font-bold text-xs rounded-xl hover:bg-emerald-800 shadow-md"
                    >
                      View Knowledge Gap Report →
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: KNOWLEDGE GAP REPORT — CORE PRODUCT FEATURE */}
          {activeTab === 'gaps' && (
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4DFD5] pb-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Knowledge Gap Report</h1>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-800 font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-gray-600" />
                    <span>Export Report</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('revision')}
                    className="flex items-center gap-2 px-4 py-2 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                    <span>View Revision Plan</span>
                  </button>
                </div>
              </div>

              {/* Top Synthesis Heatmap Card */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E4DFD5] shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Overall Mastery Assessment Score</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-extrabold text-[#003B1B]">
                        {(gapReportData?.total_topics_assessed ?? 0) === 0 ? '—' : `${gapReportData?.overall_diagnostic_score ?? 0}%`}
                      </span>
                      <span className="text-xs font-bold text-emerald-600">
                        {gapReportData?.total_topics_assessed ?? 0} Topics Evaluated
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 max-w-lg leading-relaxed pt-1">
                      {gapReportData?.summary || ((gapReportData?.total_topics_assessed ?? 0) === 0 
                        ? 'No assessments taken yet. Launch a test to map your concept mastery and identify knowledge gaps.'
                        : 'Evaluated topic mastery based on verified assessment attempts.')}
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedGapFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedGapFilter === 'all' ? 'bg-[#003B1B] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All ({gapReportData?.topic_diagnoses?.length ?? 0})
                    </button>
                    <button
                      onClick={() => setSelectedGapFilter('weak')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedGapFilter === 'weak' ? 'bg-[#BA1A1A] text-white' : 'bg-[#FFDAD6]/40 text-[#BA1A1A] hover:bg-[#FFDAD6]'
                      }`}
                    >
                      Critical Gaps ({gapReportData?.weak_topics_count ?? 0})
                    </button>
                    <button
                      onClick={() => setSelectedGapFilter('medium')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedGapFilter === 'medium' ? 'bg-[#725B38] text-white' : 'bg-[#F4EFE6] text-[#725B38] hover:bg-[#ECE8DF]'
                      }`}
                    >
                      In Progress ({gapReportData?.medium_topics_count ?? 0})
                    </button>
                    <button
                      onClick={() => setSelectedGapFilter('strong')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedGapFilter === 'strong' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-[#006E2F] hover:bg-emerald-100'
                      }`}
                    >
                      Mastered ({gapReportData?.strong_topics_count ?? 0})
                    </button>
                  </div>
                </div>
              </div>

              {/* Detailed Topic Diagnosis Cards Grid */}
              <div className="space-y-5">
                {(!gapReportData?.topic_diagnoses || gapReportData.topic_diagnoses.length === 0) ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 shadow-sm space-y-3">
                    <ShieldAlert className="w-12 h-12 text-emerald-600 mx-auto" />
                    <h3 className="text-base font-bold text-gray-900">No Knowledge Gaps Detected Yet</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Take your first assessment to evaluate concept mastery, uncover root causes of error, and populate your personalized knowledge gap report.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab('diagnostics')}
                        className="px-5 py-2.5 bg-[#003B1B] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                      >
                        <Target className="w-4 h-4 text-emerald-400" />
                        <span>Launch Skill Assessment</span>
                      </button>
                    </div>
                  </div>
                ) : (
                gapReportData.topic_diagnoses
                  ?.filter(t => selectedGapFilter === 'all' || t.classification.toLowerCase() === selectedGapFilter)
                  .map((diag, idx) => (
                    <div 
                      key={idx} 
                      className={`p-6 bg-white rounded-2xl border shadow-sm transition-all space-y-4 ${
                        diag.classification === 'Weak' 
                          ? 'border-[#FFDAD6] hover:border-[#BA1A1A] bg-[#FFDAD6]/10' 
                          : (diag.classification === 'Medium' ? 'border-[#E4DFD5] hover:border-[#C2B8A3]' : 'border-[#A7E8BD] hover:border-[#15803D]')
                      }`}
                    >
                      {/* Topic Title & Badges */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                              diag.classification === 'Weak' ? 'bg-[#FFDAD6] text-[#BA1A1A] border border-[#FFDAD6]' : (
                                diag.classification === 'Medium' ? 'bg-[#F4EFE6] text-[#725B38] border border-[#E4DFD5]' : 'bg-[#E6F4EA] text-[#006E2F] border border-[#A7E8BD]'
                              )
                            }`}>
                              {diag.classification} · {diag.mastery_score}% Mastery
                            </span>
                            <span className="text-xs text-gray-500 font-medium">{diag.unit}</span>
                            <span className="text-xs text-gray-400">({diag.exam_weight})</span>
                          </div>
                          <h3 className="text-base font-extrabold text-gray-900 mt-1">{diag.topic}</h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-gray-400">{diag.evidence_level}</span>
                          <button
                            onClick={() => handleSaveBookmark('topic', diag.topic, diag.root_cause, diag.grounding, diag.topic)}
                            className="p-1.5 text-gray-400 hover:text-[#006E2F] rounded-lg hover:bg-gray-100"
                            title="Bookmark this gap"
                          >
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 3-Section Explanatory Grid: Root Cause, Misconceptions, Grounding */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        
                        {/* Box 1: Why the student missed it */}
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
                          <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-[#BA1A1A]">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Detected Conceptual Root Cause
                          </p>
                          <p className="text-gray-700 leading-relaxed font-normal">{diag.root_cause}</p>
                        </div>

                        {/* Box 2: Misconception & Missing Prerequisite */}
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
                          <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-[#725B38]">
                            <Sparkle className="w-3.5 h-3.5" />
                            Specific Misconception
                          </p>
                          <p className="text-gray-700 leading-relaxed font-normal">{diag.misconception}</p>
                          {diag.blocked_prerequisites?.length > 0 && (
                            <div className="pt-1 text-[11px]">
                              <strong className="text-gray-600">Blocks: </strong>
                              <span className="text-[#BA1A1A] font-semibold">{diag.blocked_prerequisites.join(', ')}</span>
                            </div>
                          )}
                        </div>

                        {/* Box 3: Exact Textbook Citation & Action */}
                        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1">
                          <p className="font-bold text-gray-800 uppercase tracking-wider text-[10px] flex items-center gap-1.5 text-emerald-600">
                            <BookOpen className="w-3.5 h-3.5" />
                            Course Material Citation
                          </p>
                          <p className="text-gray-800 font-mono text-[11px]">{diag.grounding}</p>
                          <p className="pt-1 text-gray-600">
                            <strong className="text-gray-700">Action: </strong>{diag.recommended_action}
                          </p>
                        </div>

                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => {
                            setAssistantTopic(diag.topic);
                            setActiveTab('assistant');
                          }}
                          className="text-xs font-bold text-[#006E2F] hover:underline flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Ask AI Tutor to Explain this Gap</span>
                        </button>

                        <button
                          onClick={() => handleLaunchPractice(diag.topic)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Remediate with Micro-Drill</span>
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 6: PERSONALIZED REVISION PLANNER */}
          {activeTab === 'revision' && (
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4DFD5] pb-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Adaptive Revision Planner</h1>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowScheduleModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#000000] hover:bg-neutral-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>📅 Schedule Timed Revision</span>
                  </button>

                  <button
                    onClick={() => {
                      loadInitialData();
                      showToast('Revision plan re-adapted with latest mastery evidence!');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Adapt Plan</span>
                  </button>
                </div>
              </div>

              {/* Upcoming Scheduled Revision Sessions Card */}
              {scheduledSessions && scheduledSessions.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Upcoming Timed Revision Sessions ({scheduledSessions.length})
                      </h2>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      ✉️ Pre-Session Email Reminders Active via Resend
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {scheduledSessions.map((sess) => (
                      <div key={sess.id} className="p-4 rounded-xl bg-gray-50 border border-gray-200/90 hover:border-emerald-500/40 transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-gray-900 line-clamp-1">{sess.title}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {sess.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center gap-1.5 font-medium">
                            <span>📅 {sess.scheduled_date}</span>
                            <span>⏰ {sess.scheduled_time}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 line-clamp-1">
                            🎯 Focused Topic: <strong className="text-gray-700">{sess.topic}</strong>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <span>✓</span> Reminder Primed
                          </span>
                          <button
                            onClick={() => handleLaunchPractice(sess.topic)}
                            className="px-2.5 py-1 text-[11px] font-bold bg-[#003B1B] text-white hover:bg-emerald-800 rounded-lg transition-colors cursor-pointer"
                          >
                            Launch Drill Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Floating Revision Scheduler Modal Card */}
              {showScheduleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
                  <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 space-y-5 relative">
                    
                    <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                      <div>
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md mb-1 border border-emerald-200">
                          <span>⚡ Smart Time-Allocated Revision</span>
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">Schedule Timed Revision Session</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Set a revision slot. Target topics, question papers, and drills are compiled instantly, and a 5-minute pre-session reminder email is sent via Resend.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowScheduleModal(false)}
                        className="text-gray-400 hover:text-gray-700 p-1 rounded-lg text-sm font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <form onSubmit={handleCreateRevisionSchedule} className="space-y-4 text-left">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Session Title</label>
                        <input
                          type="text"
                          required
                          value={scheduleForm.title}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, title: e.target.value })}
                          placeholder="e.g. Midterm Preparation & Gap Drill"
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-gray-50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Date</label>
                          <input
                            type="date"
                            required
                            value={scheduleForm.scheduled_date}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-700 block mb-1">Time</label>
                          <input
                            type="time"
                            required
                            value={scheduleForm.scheduled_time}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_time: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-gray-50"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Grounded Source Document (Optional)</label>
                        <select
                          value={scheduleForm.document_id}
                          onChange={(e) => {
                            const docId = e.target.value;
                            setScheduleForm({ ...scheduleForm, document_id: docId });
                          }}
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-gray-50"
                        >
                          <option value="">All Uploaded Course Documents</option>
                          {documentsList && documentsList.map((doc) => (
                            <option key={doc.id} value={doc.id}>{doc.title} ({doc.doc_type})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Target Topic Focus</label>
                        <input
                          type="text"
                          value={scheduleForm.topic}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, topic: e.target.value })}
                          placeholder="e.g. Core Concept or Uploaded Chapter"
                          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-gray-50"
                        />
                      </div>

                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2">
                        <span className="text-sm">📧</span>
                        <span>
                          <strong>5-Minute Notification:</strong> An email notification will be dispatched to <strong>{currentUser?.email || 'your email'}</strong> with your name and pre-session briefing before your study slot.
                        </span>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-2.5">
                        <button
                          type="button"
                          onClick={() => setShowScheduleModal(false)}
                          className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black rounded-lg transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={schedulingLoading}
                          className="px-5 py-2 text-xs font-bold text-white bg-black hover:bg-neutral-800 rounded-lg transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                        >
                          <span>{schedulingLoading ? 'Scheduling...' : 'Confirm & Schedule Drill'}</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Personal Target Date Picker & Personal Revision Alerts Bar */}
              <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Personal Target Exam Date
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={revisionTargetDate}
                        onChange={async (e) => {
                          const newDate = e.target.value;
                          setRevisionTargetDate(newDate);
                          const token = getToken();
                          try {
                            await fetch('/api/personal/preferences', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                              },
                              body: JSON.stringify({
                                ...preferences,
                                target_exam_date: newDate
                              })
                            });
                            showToast(`Target exam date updated to ${newDate} and saved to your profile!`);
                          } catch (err) {
                            showToast('Failed to save exam date preference', 'error');
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 text-gray-800"
                      />
                      <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        {Math.max(0, Math.ceil((new Date(revisionTargetDate) - new Date()) / (1000 * 60 * 60 * 24)))} Days Remaining
                      </span>
                    </div>
                  </div>

                  <div className="sm:border-l sm:border-gray-200 sm:pl-4">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Personal Revision Alerts
                    </label>
                    <button
                      onClick={async () => {
                        const nextVal = !revisionAlertsEnabled;
                        setRevisionAlertsEnabled(nextVal);
                        const token = getToken();
                        try {
                          await fetch('/api/personal/preferences', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                              ...preferences,
                              notifications_enabled: nextVal
                            })
                          });
                          showToast(nextVal ? 'Personal revision alerts enabled (Daily at 8:00 AM) and saved!' : 'Personal revision alerts paused.');
                        } catch (err) {
                          showToast('Failed to save alert preference', 'error');
                        }
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all ${
                        revisionAlertsEnabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-gray-50 text-gray-500 border-gray-200'
                      }`}
                    >
                      <Bell className={`w-3.5 h-3.5 ${revisionAlertsEnabled ? 'text-emerald-600' : 'text-gray-400'}`} />
                      <span>{revisionAlertsEnabled ? 'Daily Alerts Active (8:00 AM)' : 'Alerts Disabled'}</span>
                    </button>
                  </div>
                </div>

                {/* Show That PDF & Upload Notes */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={() => {
                      const docToView = documentsList[0] ? { name: documentsList[0].title, page_count: documentsList[0].page_count || 1 } : (personalRevisionFiles[0] || null);
                      if (docToView) {
                        setSelectedPdfDoc(docToView);
                        setShowPdfViewer(true);
                      } else {
                        showToast('Please upload a study material first.', 'error');
                        setActiveTab('materials');
                      }
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#003B1B] hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Show That PDF</span>
                  </button>

                  <label className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-gray-300 cursor-pointer shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#006E2F]" />
                    <span>Attach Personal Notes</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const newFile = {
                            id: `p-${Date.now()}`,
                            name: file.name,
                            size: `${Math.round(file.size / 1024)} KB`,
                            uploaded_at: 'Just now',
                            type: file.type || 'application/pdf',
                            page_count: 4
                          };
                          setPersonalRevisionFiles([newFile, ...personalRevisionFiles]);
                          setSelectedPdfDoc(newFile);
                          setShowPdfViewer(true);
                          showToast(`Attached ${file.name} to personal revision plan!`);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Attached Personal Revision Files */}
              {personalRevisionFiles.length > 0 && (
                <div className="bg-[#F8F7F4] p-3.5 rounded-xl border border-[#E5E0D6] flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <FileText className="w-4 h-4 text-[#006E2F]" />
                    <span className="font-bold text-gray-800">Attached Revision Notes:</span>
                    {personalRevisionFiles.map((f) => (
                      <span key={f.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-gray-700 font-mono text-[11px]">
                        <span>{f.name}</span>
                        <span className="text-gray-400">({f.size})</span>
                        <button 
                          onClick={() => {
                            setSelectedPdfDoc(f);
                            setShowPdfViewer(true);
                          }}
                          className="text-[#006E2F] hover:text-emerald-900 font-bold ml-1 hover:underline"
                        >
                          View PDF
                        </button>
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500 font-mono">Indexed for syllabus cross-referencing</span>
                </div>
              )}

              {/* Progress Summary Strip */}
              <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#006E2F] flex items-center justify-center font-extrabold text-lg">
                    {revisionPlanData?.completed_tasks_count ?? 0}/{revisionPlanData?.tasks?.length ?? 0}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">Tasks Completed</h3>
                    <p className="text-xs text-gray-500">
                      {revisionPlanData?.remaining_tasks_count ?? 0} remaining tasks planned across {revisionPlanData?.total_days ?? 0} days
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRevisionFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${revisionFilter === 'all' ? 'bg-[#003B1B] text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    All Tasks
                  </button>
                  <button
                    onClick={() => setRevisionFilter('pending')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${revisionFilter === 'pending' ? 'bg-[#003B1B] text-[#6BFF8F]' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Pending
                  </button>
                  <button
                    onClick={() => setRevisionFilter('completed')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${revisionFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                  >
                    Completed
                  </button>
                </div>
              </div>

              {/* Daily Tasks List */}
              <div className="space-y-4">
                {(!revisionPlanData?.tasks || revisionPlanData.tasks.length === 0) ? (
                  <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 shadow-sm space-y-3">
                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <h3 className="text-base font-bold text-gray-900">No Revision Tasks Scheduled Yet</h3>
                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                      Complete your first skill assessment to identify knowledge gaps. Your adaptive daily revision schedule will be automatically generated here.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setActiveTab('diagnostics')}
                        className="px-4 py-2 bg-[#003B1B] text-white font-bold text-xs rounded-xl hover:bg-emerald-900 transition-colors inline-flex items-center gap-1.5"
                      >
                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Start Skill Assessment</span>
                      </button>
                    </div>
                  </div>
                ) : (
                revisionPlanData?.tasks
                  ?.filter(t => revisionFilter === 'all' || (revisionFilter === 'completed' ? t.completed : !t.completed))
                  .map((task, idx) => (
                    <div 
                      key={task.id || idx}
                      className={`p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        task.completed 
                          ? 'bg-gray-50 border-gray-200 opacity-70' 
                          : 'bg-white border-[#E4DFD5] shadow-xs hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <button
                          onClick={() => handleToggleRevisionTask(task.id, task.completed)}
                          className={`w-6 h-6 rounded-lg border mt-1 flex items-center justify-center transition-colors ${
                            task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-300 hover:border-emerald-500'
                          }`}
                        >
                          {task.completed && <Check className="w-4 h-4" />}
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-[#006E2F]">{task.day}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              task.priority === 'High' ? 'bg-[#FFDAD6] text-[#BA1A1A]' : 'bg-[#F4EFE6] text-[#725B38]'
                            }`}>
                              {task.priority} Priority
                            </span>
                            <span className="text-xs text-gray-400">• Est. {task.estimated_duration_minutes} mins</span>
                          </div>

                          <h3 className={`text-base font-bold text-gray-900 ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.topic}
                          </h3>

                          <p className="text-xs text-gray-600">
                            <strong>Objective: </strong>{task.revision_objective}
                          </p>

                          <p className="text-[11px] text-gray-400 font-mono">
                            Recommended Section: {task.recommended_source_section}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                        <button
                          onClick={() => handleLaunchPractice(task.topic)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#003B1B] font-bold text-xs rounded-xl transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Start {task.practice_question_count} Practice Questions</span>
                        </button>
                      </div>
                    </div>
                  )))}
              </div>

            </div>
          )}

          {/* TAB 7: GROUNDED PRACTICE EXAMINATION & ANSWER SHEET */}
          {activeTab === 'practice' && (
            <div className="max-w-7xl mx-auto space-y-6">
              
              {/* Header with Top Submit Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E4DFD5] pb-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900">Practice Examination</h1>
                </div>

                <div className="flex items-center gap-3">
                  {practicePaperData?.has_submitted ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-bold shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Submitted & Evaluated · {practicePaperData.submission?.score}/100 ({practicePaperData.submission?.percentage}%)</span>
                    </div>
                  ) : practicePaperData ? (
                    <button
                      type="button"
                      onClick={handleSubmitPracticePaper}
                      disabled={practicePaperSubmitting}
                      className="px-5 py-2.5 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-transform hover:scale-[1.02]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{practicePaperSubmitting ? 'Evaluating Harshly...' : 'Submit Test (100 Marks)'}</span>
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Topic Selector Chips (Only Grounded in Uploaded Materials) */}
              {!practiceHasDocuments || practiceTopicsList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-[#E4DFD5] p-12 text-center space-y-4">
                  <FileText className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-gray-900">No Course Material Uploaded Yet</h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Upload your syllabus, lecture notes, or textbook chapter in 'My Materials' to dynamically generate your grounded 10-Question Examination Paper.
                  </p>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className="px-5 py-2.5 bg-[#003B1B] text-white font-bold text-xs rounded-xl hover:bg-emerald-900 transition-colors inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Go to My Materials</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Topic Chips */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {practiceTopicsList.map(t => (
                      <button
                        key={t.topic}
                        onClick={() => loadPracticePaper(t.topic)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                          practiceTopic === t.topic
                            ? 'bg-[#003B1B] text-white shadow-sm ring-1 ring-emerald-600'
                            : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{t.topic}</span>
                      </button>
                    ))}
                  </div>

                  {/* Loading State */}
                  {practicePaperLoading && (
                    <div className="p-12 text-center bg-white rounded-2xl border border-gray-200 text-xs font-semibold text-gray-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>Generating Grounded 10-Question Paper from Course Material...</span>
                    </div>
                  )}

                  {/* Grounded Examination Paper & Answer Sheet */}
                  {practicePaperData && !practicePaperLoading && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Post-Submission Weakest Points & Evaluation Banner */}
                      {practicePaperData.has_submitted && practicePaperData.submission && (
                        <div className="bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#064E3B] text-white p-6 sm:p-8 rounded-3xl border border-slate-700 shadow-xl space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-4">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/30">
                                Harsh Diagnostic Evaluation Completed
                              </span>
                              <h2 className="text-xl font-black text-white mt-1">Examination Results & Knowledge Gap Summary</h2>
                            </div>
                            <div className="text-right">
                              <span className="text-3xl font-black font-mono text-emerald-400">
                                {practicePaperData.submission.score} / {practicePaperData.submission.total_marks || 100}
                              </span>
                              <span className="text-xs text-slate-300 block font-semibold">
                                Final Percentage: {practicePaperData.submission.percentage}%
                              </span>
                            </div>
                          </div>

                          {/* Weakest Points */}
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider block">
                              Diagnosed Conceptual Deficits & Weakest Points:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {practicePaperData.submission.weakest_points?.map((wp, idx) => (
                                <div key={idx} className="p-3 bg-white/10 rounded-xl border border-rose-500/30 text-xs space-y-1">
                                  <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span className="text-rose-300">{wp.topic || `Gap #${idx+1}`}</span>
                                    <span className="text-rose-400 font-mono">{wp.deficit_score ?? 40}%</span>
                                  </div>
                                  <p className="text-slate-300 text-[11px] leading-relaxed">
                                    {wp.focus_area || wp.note || "Focus on foundational definitions and architectural flows."}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-2 flex flex-wrap items-center gap-3">
                            <button
                              onClick={() => setActiveTab('gaps')}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" />
                              <span>View Knowledge Gap Report →</span>
                            </button>
                            <button
                              onClick={() => setActiveTab('revision')}
                              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Open Personalized Revision Plan →</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Split 2-Column Layout: Left (Question Paper), Right (Answer Sheet) */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        
                        {/* LEFT COLUMN: White Examination Question Paper (PDF Style) */}
                        <div className="bg-white rounded-2xl border border-gray-300 p-6 sm:p-8 shadow-sm space-y-6 max-h-[750px] overflow-y-auto custom-scrollbar">
                          {/* Formal Header */}
                          <div className="border-b border-gray-200 pb-4 text-center space-y-1">
                            <span className="text-[10px] font-extrabold tracking-widest uppercase text-gray-500">
                              GAPFINDER FORMAL EXAMINATION SERIES · 2026
                            </span>
                            <h2 className="text-lg font-black text-gray-900 tracking-tight">
                              {practicePaperData.title || `Academic Examination: ${practicePaperData.topic}`}
                            </h2>
                            <p className="text-xs text-gray-500 font-medium">
                              Course Material: <strong className="text-gray-900">{practicePaperData.document_title}</strong>
                            </p>
                            <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-gray-600 pt-1">
                              <span>Time Allowed: 45 Minutes</span>
                              <span>·</span>
                              <span>Maximum Marks: 100</span>
                              <span>·</span>
                              <span>10 Questions</span>
                            </div>
                          </div>

                          {/* Instructions */}
                          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-700 space-y-1">
                            <p className="font-bold text-gray-900">INSTRUCTIONS TO CANDIDATES:</p>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-gray-600">
                              {practicePaperData.instructions?.map((inst, idx) => (
                                <li key={idx}>{inst}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Questions List (Q1 to Q10) */}
                          <div className="space-y-4">
                            {practicePaperData.questions?.map((q, idx) => {
                              const qNum = q.number || (idx + 1);
                              const isCurrent = practiceActiveQuestionIndex === idx;
                              const isSaved = practiceSavedQuestions.includes(qNum) || Boolean((practiceAnswers[qNum] || '').trim());

                              return (
                                <div
                                  key={idx}
                                  onClick={() => setPracticeActiveQuestionIndex(idx)}
                                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                                    isCurrent
                                      ? 'border-[#003B1B] bg-emerald-50/40 ring-2 ring-[#003B1B]/15 shadow-xs'
                                      : 'border-gray-200 hover:border-gray-300 bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className={`w-6 h-6 rounded-md font-bold text-xs flex items-center justify-center ${
                                        isSaved
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {qNum}
                                      </span>
                                      <span className="font-bold text-gray-900">Question {qNum}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isSaved && (
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                          ✓ Completed
                                        </span>
                                      )}
                                      <span className="text-[11px] font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                        [10 Marks]
                                      </span>
                                    </div>
                                  </div>

                                  <p className="text-xs text-gray-800 font-medium leading-relaxed">
                                    {q.question_text || q.question}
                                  </p>

                                  {(q.key_concepts || (q.key_points && q.key_points.join(' · ')) || q.citation) && (
                                    <span className="inline-block text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                      Key: {q.key_concepts || (q.key_points && q.key_points[0]) || q.citation}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: White Examination Answer Sheet */}
                        <div className="bg-white rounded-2xl border border-gray-300 p-6 sm:p-8 shadow-sm flex flex-col justify-between max-h-[750px] space-y-5">
                          {/* Palette Strip */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                                Question Navigation Palette
                              </span>
                              <span className="text-[11px] font-bold text-emerald-700">
                                {practiceSavedQuestions.length} / 10 Answered
                              </span>
                            </div>

                            {/* 10 Question Pills: Turns Emerald Green upon completion */}
                            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                              {practicePaperData.questions?.map((_, idx) => {
                                const qNum = idx + 1;
                                const isCurrent = practiceActiveQuestionIndex === idx;
                                const isSaved = practiceSavedQuestions.includes(qNum) || Boolean((practiceAnswers[qNum] || '').trim());

                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setPracticeActiveQuestionIndex(idx)}
                                    className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center ${
                                      isSaved
                                        ? 'bg-emerald-600 text-white font-extrabold ring-2 ring-emerald-700 shadow-xs'
                                        : isCurrent
                                        ? 'bg-gray-900 text-white font-extrabold ring-2 ring-gray-900'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                                    }`}
                                  >
                                    <span>Q{qNum}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Active Question Prompt */}
                          {(() => {
                            const currentQ = practicePaperData.questions?.[practiceActiveQuestionIndex] || {};
                            const currentQNum = currentQ.number || currentQ.id || (practiceActiveQuestionIndex + 1);
                            const evaluationData = practicePaperData.submission?.evaluation?.[currentQNum] || practicePaperData.submission?.evaluation?.[String(currentQNum)];

                            return (
                              <div className="flex-1 flex flex-col justify-between space-y-4">
                                <div className="space-y-2 border-t border-gray-100 pt-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                                      Candidate Answer Sheet · Question {currentQNum} of 10
                                    </span>
                                    <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg">
                                      Carries: 10 Marks
                                    </span>
                                  </div>

                                  <h3 className="text-sm font-bold text-gray-900 leading-snug">
                                    {currentQ.question_text || currentQ.question}
                                  </h3>
                                </div>

                                {/* Subjective Writing Area */}
                                <div className="flex-1">
                                  <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
                                    Candidate Written Solution / Mathematical Derivation:
                                  </label>
                                  <textarea
                                    rows={10}
                                    value={practiceAnswers[currentQNum] || ''}
                                    onChange={(e) => {
                                      if (!practicePaperData.has_submitted) {
                                        setPracticeAnswers(prev => ({ ...prev, [currentQNum]: e.target.value }));
                                      }
                                    }}
                                    disabled={practicePaperData.has_submitted}
                                    placeholder={
                                      practicePaperData.has_submitted
                                        ? "This examination has been submitted. Answers are locked in read-only mode."
                                        : `Write your comprehensive analytical solution for Question ${currentQNum} here. Include step-by-step principles, mathematical proofs, and architectural details...`
                                    }
                                    className={`w-full p-4 rounded-xl border text-xs font-mono leading-relaxed transition-all focus:outline-none ${
                                      practicePaperData.has_submitted
                                        ? 'bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed'
                                        : 'bg-white border-gray-300 focus:border-[#003B1B] focus:ring-1 focus:ring-[#003B1B]'
                                    }`}
                                  />
                                </div>

                                {/* Evaluation Feedback for this Question (Post-Submission) */}
                                {practicePaperData.has_submitted && evaluationData && (
                                  <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5 text-xs">
                                    <div className="flex items-center justify-between font-bold">
                                      <span className="text-amber-900">Academic Grading Feedback (Harsh Rubric):</span>
                                      <span className="text-amber-950 font-mono text-sm">
                                        Marks: {evaluationData.marks} / 10
                                      </span>
                                    </div>
                                    <p className="text-gray-700 leading-relaxed font-sans">
                                      {evaluationData.critique}
                                    </p>
                                  </div>
                                )}

                                {/* Bottom Buttons: Prev, Next, Save & Next, and Submit */}
                                <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={practiceActiveQuestionIndex === 0}
                                      onClick={() => setPracticeActiveQuestionIndex(prev => Math.max(0, prev - 1))}
                                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      <ArrowLeft className="w-3.5 h-3.5" /> Previous
                                    </button>
                                    <button
                                      type="button"
                                      disabled={practiceActiveQuestionIndex === (practicePaperData.questions?.length - 1)}
                                      onClick={() => setPracticeActiveQuestionIndex(prev => Math.min(practicePaperData.questions.length - 1, prev + 1))}
                                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                                    >
                                      Next <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {!practicePaperData.has_submitted ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={handleSaveAndNextPracticeQuestion}
                                        className="px-5 py-2.5 bg-[#003B1B] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Save & Next</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleSubmitPracticePaper}
                                        disabled={practicePaperSubmitting}
                                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                                        <span>Submit Test</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs font-bold text-gray-500 italic">
                                      🔒 Submission locked. View feedback above.
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {/* TAB 8: PROGRESS ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="max-w-7xl mx-auto space-y-8">
              
              <div className="border-b border-[#E4DFD5] pb-5">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Progress Analytics & Telemetry</h1>
              </div>

              {/* 3 Metric Mini Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm">
                  <span className="text-xs font-bold text-gray-400 uppercase">Knowledge Growth</span>
                  <div className="text-3xl font-extrabold text-[#003B1B] mt-1">
                    {(analyticsData?.total_topics ?? 0) === 0 ? '—' : `${analyticsData?.overall_knowledge_score ?? 0}%`}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(analyticsData?.total_topics ?? 0) === 0 ? 'No assessments taken yet' : `Across ${analyticsData?.total_topics} assessed topics`}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm">
                  <span className="text-xs font-bold text-gray-400 uppercase">Weak Topics Resolved</span>
                  <div className="text-3xl font-extrabold text-emerald-600 mt-1">
                    {analyticsData?.weak_topics_resolved ?? 0} Topics
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(analyticsData?.total_topics ?? 0) === 0 ? 'Complete assessments to identify gaps' : `Out of ${analyticsData?.total_topics} topics tracked`}
                  </p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-[#E4DFD5] shadow-sm">
                  <span className="text-xs font-bold text-gray-400 uppercase">Study Activity</span>
                  <div className="text-3xl font-extrabold text-gray-900 mt-1">
                    {analyticsData?.study_hours_total ?? 0} hrs
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {historyList.length === 0 ? 'No activity recorded yet' : `${historyList.length} verified learning event(s)`}
                  </p>
                </div>
              </div>

              {/* Topic Bars Breakdown */}
              <div className="bg-white p-6 rounded-2xl border border-[#E4DFD5] shadow-sm space-y-4">
                <h2 className="font-bold text-base text-gray-900">Topic-by-Topic Mastery Telemetry</h2>
                {(!analyticsData?.topic_bars || analyticsData.topic_bars.length === 0) ? (
                  <div className="p-8 text-center rounded-xl border border-dashed border-gray-200 bg-[#FAF8F5]">
                    <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-700">No Topic Telemetry Available</p>
                    <p className="text-[11px] text-gray-500 mt-1 max-w-sm mx-auto">
                      Complete a skill assessment or targeted practice drill to record topic mastery scores.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    {analyticsData.topic_bars.map((t, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-gray-700">
                          <span>{t.topic}</span>
                          <span className={t.score < 50 ? 'text-[#BA1A1A]' : (t.score < 80 ? 'text-[#725B38]' : 'text-[#006E2F]')}>
                            {t.score}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-700 ${
                              t.score < 50 ? 'bg-[#BA1A1A]' : (t.score < 80 ? 'bg-[#C2B8A3]' : 'bg-[#15803D]')
                            }`} 
                            style={{ width: `${t.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 9: LEARNING HISTORY */}
          {activeTab === 'history' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div className="border-b border-[#E4DFD5] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Learning History</h1>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      historyFilter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    All ({historyList.length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('quiz')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      historyFilter === 'quiz' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Quizzes
                  </button>
                  <button
                    onClick={() => setHistoryFilter('revision')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      historyFilter === 'revision' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Revision
                  </button>
                  <button
                    onClick={() => setHistoryFilter('material')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      historyFilter === 'material' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Materials
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {(() => {
                  const filtered = historyList.filter(act => {
                    if (historyFilter === 'all') return true;
                    if (historyFilter === 'quiz') return act.tag?.toLowerCase().includes('quiz') || act.tag?.toLowerCase().includes('diagnostic');
                    if (historyFilter === 'revision') return act.tag?.toLowerCase().includes('revision');
                    if (historyFilter === 'material') return act.tag?.toLowerCase().includes('material') || act.tag?.toLowerCase().includes('document');
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 shadow-sm space-y-3">
                        <History className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <h3 className="text-base font-bold text-gray-900">No Learning Activity Recorded Yet</h3>
                        <p className="text-xs text-gray-500 max-w-sm mx-auto">
                          As you complete assessments, practice drills, revision tasks, and upload study documents, your authentic learning stream will appear here.
                        </p>
                      </div>
                    );
                  }

                  return filtered.map((act) => {
                    const isHundred = act.score >= 95 || act.achievement?.includes('100%');
                    return (
                      <div 
                        key={act.id} 
                        className={`p-5 bg-white rounded-2xl border transition-all flex items-start gap-4 shadow-xs ${
                          isHundred ? 'border-emerald-300 ring-1 ring-emerald-500/20' : 'border-[#E4DFD5]'
                        }`}
                      >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isHundred 
                            ? 'bg-emerald-100 text-[#006E2F]' 
                            : (act.tag?.includes('Revision') ? 'bg-[#F4EFE6] text-[#725B38] border border-[#E4DFD5]' : 'bg-[#E6F4EA] text-[#006E2F] border border-[#A7E8BD]')
                        }`}>
                          {isHundred ? <Award className="w-6 h-6 text-[#006E2F]" /> : <History className="w-5 h-5 text-gray-600" />}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                {act.tag || 'Activity'}
                              </span>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs font-bold text-gray-900">
                                {act.topic_heading || act.title}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Achievement Badge */}
                              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                                isHundred
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : (act.badge_color || 'bg-gray-100 text-gray-700 border-gray-200')
                              }`}>
                                {isHundred && <Award className="w-3 h-3 text-[#006E2F]" />}
                                <span>{act.achievement || `${act.score || 100}% Achieved`}</span>
                              </span>

                              <span className="text-[11px] font-mono text-gray-400">
                                {act.timestamp_label || 'Today'}
                              </span>
                            </div>
                          </div>

                          <div className="bg-[#FAF8F5] p-3 rounded-xl border border-gray-100">
                            <p className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>{act.aspect_completed || act.title}</span>
                            </p>
                            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {act.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

            </div>
          )}

          {/* TAB 10: SHUBH AI ASSISTANT */}
          {activeTab === 'assistant' && (
            <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl border border-[#E5E0D6] shadow-lg overflow-hidden">
              
              {/* Assistant Header */}
              <div className="p-4 border-b border-gray-200 flex items-center bg-[#FAF8F5]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#0A0D0E] text-emerald-300 flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-gray-900">Shubh AI</h2>
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                      Agent
                    </span>
                  </div>
                </div>
              </div>

              {/* Chat Message Scroll Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar bg-[#FAF9F7]">
                {assistantMessages.length === 0 && (
                  <div className="max-w-xl mx-auto py-8 space-y-4">
                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider text-center">
                      Autonomous Agent Direct Actions
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => handleSendMessage("Analyze my active curriculum and identify critical knowledge gaps with root causes.")}
                        className="p-4 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-2xl text-left transition-all shadow-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-900">Run Gap Diagnostics</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSendMessage("Synthesize an adaptive 5-day revision plan prioritizing my weakest prerequisite topics.")}
                        className="p-4 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-2xl text-left transition-all shadow-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Calendar className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-900">Compile Remedial Revision Plan</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSendMessage("Generate a visual concept flowchart linking foundational prerequisites to advanced topics using Mermaid syntax.")}
                        className="p-4 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-2xl text-left transition-all shadow-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-900">Build Concept Dependency Flowchart</span>
                        </div>
                      </button>

                      <button
                        onClick={() => handleSendMessage("Verify textbook and syllabus grounding citations for my current course materials.")}
                        className="p-4 bg-white hover:bg-emerald-50/50 border border-gray-200 hover:border-emerald-300 rounded-2xl text-left transition-all shadow-xs group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Search className="w-4 h-4 text-cyan-600" />
                          <span className="text-xs font-bold text-gray-900 group-hover:text-emerald-900">Audit Course Citations</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
                {assistantMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-xl bg-[#0A0D0E] text-emerald-300 flex items-center justify-center shrink-0 text-xs font-bold shadow-xs">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                    <div className={`p-5 rounded-2xl text-xs max-w-2xl space-y-3 leading-relaxed shadow-xs ${
                      msg.role === 'user' 
                        ? 'bg-[#0A0D0E] text-white rounded-br-none shadow-sm' 
                        : 'bg-white border border-[#E5E0D6] text-gray-800 rounded-bl-none'
                    }`}>
                      <p className="whitespace-pre-line text-[13px]">{msg.text}</p>

                      {/* Render Visual Flowchart if Mermaid diagram exists */}
                      {msg.text && (msg.text.includes('```mermaid') || msg.text.includes('graph TD') || msg.text.includes('flowchart TD')) && (
                        <FlowchartViewer content={msg.text} />
                      )}

                      {/* Display Citations if available */}
                      {msg.citations?.length > 0 && (
                        <div className="pt-2 border-t border-gray-200/60 space-y-1.5">
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Verified Grounding Citations:
                          </p>
                          {msg.citations.map((c, cIdx) => (
                            <div key={cIdx} className="text-[11px] font-mono text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-800">{c.citation}</span>
                                <span className="text-[10px] text-gray-400">{c.document_title}</span>
                              </div>
                              <p className="text-[10px] text-gray-600 mt-1 italic font-serif">"{c.excerpt}"</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {assistantLoading && (
                  <div className="flex items-center gap-2.5 text-xs text-gray-500 italic p-4 bg-white rounded-xl border border-gray-200 w-fit">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#006E2F]" />
                    <span>Shubh AI is analyzing your coursework materials...</span>
                  </div>
                )}
              </div>

              {/* Attachment Preview Chip */}
              {assistantAttachment && (
                <div className="px-5 py-2.5 bg-emerald-50 border-t border-emerald-200 flex items-center justify-between text-xs text-emerald-950 font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-[#006E2F] shrink-0" />
                    <span className="truncate">{assistantAttachment.name}</span>
                  </div>
                  <button 
                    onClick={() => setAssistantAttachment(null)}
                    className="text-[#006E2F] hover:text-emerald-950 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-gray-200 bg-[#FAF8F5] flex items-center gap-3">
                <input 
                  type="file" 
                  ref={fullAssistantFileInputRef} 
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setAssistantAttachment({
                          name: f.name,
                          size: f.size,
                          type: f.type,
                          content: typeof ev.target.result === 'string' ? ev.target.result.slice(0, 4000) : ''
                        });
                      };
                      if (f.type.includes('text') || f.name.endsWith('.txt') || f.name.endsWith('.md')) {
                        reader.readAsText(f);
                      } else {
                        setAssistantAttachment({
                          name: f.name,
                          size: f.size,
                          type: f.type,
                          content: `Document: ${f.name} (${Math.round(f.size / 1024)} KB)`
                        });
                      }
                    }
                  }} 
                  className="hidden" 
                  accept=".pdf,.docx,.txt,.md,.png,.jpg"
                />
                <button
                  type="button"
                  onClick={() => fullAssistantFileInputRef.current?.click()}
                  title="Attach study document or image"
                  className="p-2.5 text-gray-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-xl transition-colors border border-gray-200 bg-white"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder={`Ask Shubh AI, request a concept flowchart, or discuss ${assistantTopic || 'your syllabus'}...`}
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2.5 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={assistantLoading || (!assistantInput.trim() && !assistantAttachment)}
                  className="px-5 py-2.5 bg-[#0A0D0E] hover:bg-[#003B1B] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Send</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 11: BOOKMARKS */}
          {activeTab === 'bookmarks' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b border-[#E4DFD5] pb-5">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Saved Bookmarks</h1>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {bookmarksList.length === 0 ? (
                  <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 shadow-sm space-y-2">
                    <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <h3 className="text-sm font-bold text-gray-900">No Bookmarks Saved Yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Bookmark key formulas, theorems, and textbook citations during study to easily review them here.
                    </p>
                  </div>
                ) : (
                  bookmarksList.map(bm => (
                    <div key={bm.id} className="p-5 bg-white rounded-2xl border border-[#E4DFD5] shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          {bm.item_type}
                        </span>
                        <button
                          onClick={async () => {
                            const token = getToken();
                            await fetch(`/api/personal/bookmarks/${bm.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                            setBookmarksList(bms => bms.filter(b => b.id !== bm.id));
                            showToast('Bookmark removed.');
                          }}
                          className="text-gray-400 hover:text-[#BA1A1A]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900">{bm.title}</h3>
                      <p className="text-xs text-gray-600">{bm.subtitle}</p>
                      <p className="text-[11px] font-mono text-[#006E2F] pt-1">Ref: {bm.source_ref}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 12: MY NOTES */}
          {activeTab === 'notes' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between border-b border-[#E4DFD5] pb-5">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Student Conceptual Notes</h1>
                </div>
                <button
                  onClick={() => setNewNoteModal(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#003B1B] hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Add Note
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {notesList.length === 0 ? (
                  <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-dashed border-gray-200 shadow-sm space-y-2">
                    <StickyNote className="w-8 h-8 text-gray-300 mx-auto mb-1" />
                    <h3 className="text-sm font-bold text-gray-900">No Conceptual Notes Created Yet</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      Click the "Add Note" button above to record your first student concept note or summary.
                    </p>
                  </div>
                ) : (
                  notesList.map(note => (
                    <div key={note.id} className="p-5 bg-white rounded-2xl border border-[#E4DFD5] shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {note.topic}
                        </span>
                        <button
                          onClick={async () => {
                            const token = getToken();
                            await fetch(`/api/personal/notes/${note.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                            setNotesList(notes => notes.filter(n => n.id !== note.id));
                            showToast('Note deleted.');
                          }}
                          className="text-gray-400 hover:text-[#BA1A1A]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <h3 className="font-bold text-sm text-gray-900">{note.title}</h3>
                      <p className="text-xs text-gray-700 leading-relaxed font-normal whitespace-pre-line">{note.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Modal */}
              {newNoteModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 max-w-lg w-full p-6 space-y-4">
                    <h3 className="font-bold text-base text-gray-900">Create Conceptual Note</h3>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Topic</label>
                      <input 
                        type="text" 
                        value={newNoteData.topic} 
                        onChange={(e) => setNewNoteData({ ...newNoteData, topic: e.target.value })}
                        className="w-full p-2 text-xs border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Title</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Multiplicity vs Eigenspace Dimension"
                        value={newNoteData.title} 
                        onChange={(e) => setNewNoteData({ ...newNoteData, title: e.target.value })}
                        className="w-full p-2 text-xs border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-700 block mb-1">Note Content</label>
                      <textarea 
                        rows={4}
                        placeholder="Write your explanation or key formula..."
                        value={newNoteData.content} 
                        onChange={(e) => setNewNoteData({ ...newNoteData, content: e.target.value })}
                        className="w-full p-2 text-xs border rounded-lg"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <button onClick={() => setNewNoteModal(false)} className="px-4 py-2 border rounded-lg text-xs font-bold">Cancel</button>
                      <button onClick={handleCreateNote} className="px-4 py-2 bg-[#003B1B] text-white rounded-lg text-xs font-bold">Save Note</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 13: SETTINGS & PREFERENCES */}
          {activeTab === 'settings' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="border-b border-[#E4DFD5] pb-5">
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Learning Preferences & System Settings</h1>
              </div>

              {/* AI Engine Status Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E4DFD5] shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-bold text-base text-gray-900">Adaptive Learning Engine</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="font-bold text-emerald-900 block">Adaptive Fast Engine</span>
                    <span className="text-[11px] text-[#006E2F] font-medium mt-1 block">Real-time Concept Tracing · Active</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="font-bold text-gray-900 block">Pedagogical Reasoning</span>
                    <span className="text-[11px] text-gray-600 font-medium mt-1 block">Socratic Misconception Analysis</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200">
                    <span className="font-bold text-gray-900 block">Knowledge Grounding</span>
                    <span className="text-[11px] text-gray-600 font-medium mt-1 block">Curriculum & Syllabus Verification</span>
                  </div>
                </div>
              </div>

              {/* Learning Preferences Form */}
              <div className="bg-white p-6 rounded-2xl border border-[#E4DFD5] shadow-sm space-y-4">
                <h2 className="font-bold text-base text-gray-900">Active Study Goals</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Target Exam Date</label>
                    <input 
                      type="date"
                      value={preferences.target_exam_date}
                      onChange={(e) => setPreferences({ ...preferences, target_exam_date: e.target.value })}
                      className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">Daily Study Target (minutes)</label>
                    <input 
                      type="number"
                      value={preferences.daily_study_minutes}
                      onChange={(e) => setPreferences({ ...preferences, daily_study_minutes: parseInt(e.target.value) || 60 })}
                      className="w-full p-2.5 text-xs bg-gray-50 border rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={async () => {
                      const token = getToken();
                      await fetch('/api/personal/preferences', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify(preferences)
                      });
                      showToast('Preferences updated successfully!');
                    }}
                    className="px-5 py-2.5 bg-[#003B1B] text-white font-bold text-xs rounded-xl shadow-xs"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>

              {/* Reset Knowledge Baseline Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#FFDAD6] shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Reset Knowledge Gap Baseline</h3>
                  <p className="text-xs text-gray-500">Resets student topic masteries back to the initial baseline.</p>
                </div>
                <button
                  onClick={handleResetGaps}
                  className="px-4 py-2 border border-[#FFDAD6] text-[#BA1A1A] hover:bg-[#FFDAD6]/40 text-xs font-bold rounded-xl transition-colors"
                >
                  Reset Baseline
                </button>
              </div>

            </div>
          )}

          {/* TAB 14: PROFILE & STREAKS (GITHUB INSPIRED) */}
          {activeTab === 'profile' && (
            <ProfileView 
              currentUser={currentUser} 
              dashboardData={dashboardData} 
              activityList={historyList} 
            />
          )}

            </>
          )}

        </main>
      </div>

      {/* Floating Shubh AI Assistant Drawer */}
      <FloatingAssistantDrawer
        isOpen={isFloatingAssistantOpen}
        onToggle={() => setIsFloatingAssistantOpen(!isFloatingAssistantOpen)}
        onClose={() => setIsFloatingAssistantOpen(false)}
        onRedirectToOriginalPage={() => {
          setActiveTab('assistant');
          setIsFloatingAssistantOpen(false);
        }}
        activeTab={activeTab}
        assistantMessages={assistantMessages}
        assistantLoading={assistantLoading}
        onSendMessage={(msg, extra) => handleSendMessage(msg, extra)}
        currentUser={currentUser}
      />

      {/* ===================== IN-PLACE "SHOW THAT PDF" DOCUMENT VIEWER MODAL ===================== */}
      {showPdfViewer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-[#FAF8F5] w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl border border-gray-300 flex flex-col overflow-hidden">
            {/* PDF Viewer Top Bar */}
            <div className="h-14 bg-[#0A0D0E] text-white px-5 flex items-center justify-between border-b border-[#22282C] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-300">
                  <FileText className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                    {selectedPdfDoc?.name || 'Uploaded_Study_Material.pdf'}
                  </h3>
                  <p className="text-[10px] text-emerald-300/80 font-mono">
                    Text Grounded · Ingested Concepts · Verified Academic Grounding
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Page Navigation */}
                <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-lg border border-emerald-800 text-xs font-mono">
                  <button
                    onClick={() => setPdfCurrentPage(Math.max(1, pdfCurrentPage - 1))}
                    disabled={pdfCurrentPage <= 1}
                    className="px-1.5 py-0.5 hover:text-emerald-300 disabled:opacity-30 cursor-pointer"
                  >
                    &lt;
                  </button>
                  <span>Page {pdfCurrentPage} of {selectedPdfDoc?.page_count || 12}</span>
                  <button
                    onClick={() => setPdfCurrentPage(Math.min(selectedPdfDoc?.page_count || 12, pdfCurrentPage + 1))}
                    disabled={pdfCurrentPage >= (selectedPdfDoc?.page_count || 12)}
                    className="px-1.5 py-0.5 hover:text-emerald-300 disabled:opacity-30 cursor-pointer"
                  >
                    &gt;
                  </button>
                </div>

                <button
                  onClick={() => showToast('PDF document downloaded to local device!')}
                  className="p-1.5 text-gray-300 hover:text-white rounded-lg hover:bg-emerald-900/60 transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setShowPdfViewer(false)}
                  className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-emerald-900 transition-colors ml-2"
                  title="Close Viewer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Document Body Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-[#E8E4DC] custom-scrollbar">
              <div className="bg-white w-full max-w-3xl min-h-[700px] p-6 sm:p-12 shadow-xl rounded-xl border border-gray-300 space-y-6 text-[#1A1A1A]">
                {/* Document Academic Header */}
                <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#006E2F]">
                      {currentUser?.course || 'Foundational STEM & Computing'} · Grounded Syllabus & Notes
                    </span>
                    <h1 className="text-xl font-serif font-bold text-gray-900 mt-1">
                      {pdfCurrentPage === 1 && "Course Syllabus & Concept Baseline"}
                      {pdfCurrentPage === 2 && "Chapter 2: Core Grounded Architecture & Principles"}
                      {pdfCurrentPage === 3 && "Chapter 4: Orthogonality, Gram-Schmidt & Projections"}
                      {pdfCurrentPage >= 4 && "Chapter 5: Eigenspaces, Characteristic Roots & Jordan Form"}
                    </h1>
                  </div>
                  <span className="font-mono text-xs text-gray-400">Section §{pdfCurrentPage}.0</span>
                </div>

                {/* PDF Page Body with grounded formulas and theorems */}
                <div className="space-y-4 text-xs leading-relaxed text-gray-800 font-serif">
                  {pdfCurrentPage === 1 && (
                    <>
                      <p>
                        <strong>Ingested Scope:</strong> Foundational theory and computation in linear vector spaces, kernel dimensions, characteristic roots, and spectral decompositions.
                      </p>
                      <div className="p-4 bg-emerald-50/70 border-l-4 border-emerald-700 rounded text-emerald-950 font-sans">
                        <p className="font-bold text-[11px] mb-1">Syllabus Grounding Notice:</p>
                        <p className="text-[11px]">
                          All assessments directly evaluate prerequisites against the theorem dependencies listed below. Passing practice drills closes verified knowledge gaps.
                        </p>
                      </div>
                      <div className="space-y-2 pt-2">
                        <h4 className="font-bold text-xs uppercase tracking-wide text-gray-700 font-sans">Key Milestone Topics</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-700">
                          <li>§2.1: Vector Space Axioms & Column Spaces</li>
                          <li>§2.3: Dimension & The Fundamental Theorem of Linear Algebra</li>
                          <li>§4.1: Orthogonal Complements & Projection Matrices</li>
                          <li>§5.2: Diagonalizability & Geometric Multiplicity</li>
                        </ul>
                      </div>
                    </>
                  )}

                  {pdfCurrentPage === 2 && (
                    <>
                      <div className="p-4 bg-[#F4EFE6]/70 border border-[#D8D2C5] rounded-xl font-sans">
                        <span className="text-[10px] uppercase font-extrabold text-[#725B38] tracking-wider">
                          Flagged by Adaptive Learning Engine · Critical Gap Reference
                        </span>
                        <h3 className="font-bold text-sm text-gray-900 mt-1 font-serif">
                          Theorem 2.3 (The Rank-Nullity Theorem)
                        </h3>
                        <p className="mt-2 text-xs italic font-serif">
                          Let \(T: V \to W\) be a linear transformation between finite-dimensional vector spaces. Then:
                        </p>
                        <div className="my-3 py-2 px-4 bg-white border border-gray-200 rounded-lg text-center font-mono font-bold text-sm text-emerald-900">
                          dim(V) = rank(T) + nullity(T)
                        </div>
                        <p className="text-[11px] text-gray-700 mt-2">
                          <strong>Root Misconception Identified:</strong> Student assessments frequently confuse geometric multiplicity (nullity of \(A - \lambda I\)) with algebraic multiplicity of roots of the characteristic polynomial \(\det(A - \lambda I) = 0\).
                        </p>
                      </div>

                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                        <h4 className="font-bold text-xs text-gray-800 font-sans">Geometric Interpretation:</h4>
                        <p>
                          The kernel \(\ker(T)\) contains all vectors mapped to the zero vector. If \(\text{nullity}(T) &gt; 0\), the transformation is not injective, implying determinant \(\det(A) = 0\).
                        </p>
                      </div>
                    </>
                  )}

                  {pdfCurrentPage === 3 && (
                    <>
                      <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl font-sans">
                        <h3 className="font-bold text-sm text-gray-900 font-serif">
                          Projection Matrix Formulation & Spectral Resolution
                        </h3>
                        <div className="my-3 py-2 px-4 bg-white border border-gray-200 rounded-lg text-center font-mono font-bold text-sm text-emerald-900">
                          P = A (A^T A)^(-1) A^T &nbsp;&nbsp;|&nbsp;&nbsp; P^2 = P &nbsp;&nbsp;|&nbsp;&nbsp; P^T = P
                        </div>
                        <p className="text-[11px] text-gray-700 mt-2">
                          Orthogonal projection onto the subspace \(S = \text{col}(A)\). If the column vectors of \(A\) form an orthonormal basis, this reduces to \(P = A A^T\).
                        </p>
                      </div>
                    </>
                  )}

                  {pdfCurrentPage >= 4 && (
                    <>
                      <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl font-sans">
                        <h3 className="font-bold text-sm text-gray-900 font-serif">
                          Eigenspace Defectiveness & Jordan Blocks
                        </h3>
                        <div className="my-3 py-2 px-4 bg-white border border-gray-200 rounded-lg text-center font-mono font-bold text-sm text-emerald-900">
                          J = V^(-1) A V = \text{diag}(J_1, J_2, \dots, J_k)
                        </div>
                        <p className="text-[11px] text-gray-700 mt-2">
                          A matrix is diagonalizable if and only if the sum of dimensions of its eigenspaces equals \(n\). When algebraic multiplicity exceeds geometric multiplicity, generalized eigenvectors form Jordan chains.
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-8 border-t border-gray-200 flex justify-between text-[11px] font-mono text-gray-400">
                  <span>GapFinder AI Ingested PDF Viewer</span>
                  <span>Page {pdfCurrentPage} of {selectedPdfDoc?.page_count || 12}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================== STUDENT ASSIGNMENT ATTEMPT RUNNER MODAL ===================== */}
      {studentAssignmentModalOpen && activeStudentAssignment && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-4xl w-full h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Top Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-[#FAF8F5] shrink-0">
              <div>
                <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                  {activeStudentAssignment.assignment_type === 'quiz' ? 'Adaptive Quiz (30 MCQs)' : 'Question Paper (10 Questions)'}
                </span>
                <h2 className="text-base font-extrabold text-gray-900 mt-1">{activeStudentAssignment.title}</h2>
                <p className="text-xs text-gray-500">Topic: <strong className="text-black">{activeStudentAssignment.topic}</strong> · Faculty: {activeStudentAssignment.faculty_name}</p>
              </div>

              <div className="flex items-center gap-3">
                {/* Countdown Timer */}
                {!studentAssignmentResult && (
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold border shadow-xs ${
                    studentAssignmentTimer < 180 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-white text-gray-800 border-gray-200'
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{Math.floor(studentAssignmentTimer / 60)}:{String(studentAssignmentTimer % 60).padStart(2, '0')}</span>
                  </div>
                )}

                {!studentAssignmentResult && (
                  <button
                    type="button"
                    onClick={handleSubmitStudentAssignment}
                    disabled={studentAssignmentSubmitting}
                    className="px-4 py-2 bg-[#003B1B] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    {studentAssignmentSubmitting ? 'Evaluating...' : 'Submit & Grade'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (!studentAssignmentResult && !window.confirm('Exit assignment? Your progress in this attempt will be saved.')) return;
                    setStudentAssignmentModalOpen(false);
                    setActiveStudentAssignment(null);
                  }}
                  className="p-1.5 text-gray-400 hover:text-black rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar text-xs">
              {studentAssignmentResult ? (
                /* Results Screen */
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-6 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-center space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-200 text-emerald-950 px-3 py-1 rounded-full">
                      Assessment Evaluation Complete
                    </span>
                    <h3 className="text-2xl font-black text-gray-900">
                      Score: {studentAssignmentResult.percentage}% ({studentAssignmentResult.score}/{studentAssignmentResult.total_marks})
                    </h3>
                    <p className="text-xs text-gray-600 max-w-md mx-auto">
                      Telemetry logged to instructor cohort dashboard in real time. Your topic mastery has been dynamically re-calibrated.
                    </p>
                    <button
                      type="button"
                      onClick={() => { setStudentAssignmentModalOpen(false); setActiveStudentAssignment(null); }}
                      className="px-6 py-2.5 bg-[#003B1B] text-white font-bold rounded-xl text-xs hover:bg-emerald-900 transition-colors shadow-sm cursor-pointer"
                    >
                      Return to Workspace
                    </button>
                  </div>

                  {/* Question Breakdown */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-gray-900">Question Evaluation Breakdown:</h4>
                    {(studentAssignmentResult.review || []).map((rev, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">Q{idx + 1}: {rev.question}</span>
                          {rev.is_correct !== undefined ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${rev.is_correct ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {rev.is_correct ? 'Correct (+1)' : 'Incorrect (0)'}
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-emerald-700">
                              {rev.marks_awarded} / {rev.marks_possible} Marks
                            </span>
                          )}
                        </div>
                        {rev.explanation && (
                          <p className="text-gray-700 bg-white p-2.5 rounded border border-gray-200 leading-relaxed">
                            <strong>Explanation: </strong>{rev.explanation}
                          </p>
                        )}
                        {rev.citation && (
                          <p className="text-[10px] font-mono text-emerald-800">Ref: {rev.citation}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Question Paper / Quiz Form */
                <div className="space-y-6">
                  {studentAssignmentQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-5 rounded-2xl border border-gray-200 bg-white space-y-3 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded">
                          Question {idx + 1} of {studentAssignmentQuestions.length}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {q.marks ? `${q.marks} Marks` : '1 Mark'} · {q.difficulty}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-gray-900 leading-relaxed">
                        {q.question}
                      </p>

                      {/* Options for Quiz */}
                      {activeStudentAssignment.assignment_type === 'quiz' && q.options && (
                        <div className="space-y-2 pt-1">
                          {q.options.map((opt, oIdx) => {
                            const isSelected = studentAssignmentAnswers[String(q.id)] === oIdx;
                            return (
                              <button
                                key={oIdx}
                                type="button"
                                onClick={() => setStudentAssignmentAnswers({ ...studentAssignmentAnswers, [String(q.id)]: oIdx })}
                                className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500 font-bold'
                                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 font-medium'
                                }`}
                              >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>
                                <span className="flex-1">{opt}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Text Response for Question Paper */}
                      {activeStudentAssignment.assignment_type !== 'quiz' && (
                        <div className="pt-1">
                          <label className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Your Written Response:</label>
                          <textarea
                            rows={4}
                            value={studentAssignmentAnswers[String(q.id)] || ''}
                            onChange={(e) => setStudentAssignmentAnswers({ ...studentAssignmentAnswers, [String(q.id)]: e.target.value })}
                            placeholder="Type your derivation, mathematical proofs, or detailed conceptual explanation here..."
                            className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-xs focus:bg-white focus:ring-1 focus:ring-black leading-relaxed"
                          />
                        </div>
                      )}

                      {q.citation && (
                        <div className="pt-1 border-t border-gray-100 text-[10px] text-gray-400 font-mono">
                          Source Grounding: {q.citation}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={handleSubmitStudentAssignment}
                      disabled={studentAssignmentSubmitting}
                      className="px-6 py-3 bg-[#003B1B] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {studentAssignmentSubmitting ? 'Evaluating Submission...' : 'Complete & Submit Assignment'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 md:hidden flex">
          <div className="w-72 bg-[#0A0D0E] text-white h-full flex flex-col justify-between p-4 border-r border-[#22282C] animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#22282C]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#0A0D0E] border border-[#22282C] flex items-center justify-center text-[#FAF8F5]">
                    <svg className="w-4 h-4 text-[#FAF8F5]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.5L20.5 7.5V16.5L12 21.5L3.5 16.5V7.5L12 2.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="1.2" fill="#0DFA6C" />
                    </svg>
                  </div>
                  <span className="font-serif italic text-lg text-white">
                    GapFinder {isTeacher ? 'Faculty' : 'AI'}
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)]">
                {navItems.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1">
                    <p className="px-3 text-[10px] font-bold text-gray-400 uppercase">{group.section}</p>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                          isNavActive(item.id) ? 'bg-[#003B1B] text-[#6BFF8F] font-semibold' : 'text-gray-400 hover:text-white hover:bg-[#161A1D]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#003B1B] text-[#6BFF8F] border border-[#14532D]">{item.badge}</span>}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#22282C] flex items-center justify-between">
              <span className="text-xs text-gray-300 truncate">{currentUser?.name || (isTeacher ? 'Faculty Administrator' : 'Alex Chen')}</span>
              <button onClick={onLogout} className="text-xs text-[#BA1A1A] font-bold hover:underline">Sign out</button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
        </div>
      )}

    </div>
  );
}
