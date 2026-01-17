import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useData } from '@/contexts/DataContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi! I can help you understand your Aadhaar data. Try asking about enrollments, demographics, states, or trends.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { enrollmentData, demographicData, biometricData, getAggregatedStateData } = useData();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const analyzeData = (question: string): string => {
    const q = question.toLowerCase().trim();
    const stateData = getAggregatedStateData();
    
    const hasEnrollment = enrollmentData.length > 0;
    const hasDemographic = demographicData.length > 0;
    const hasBiometric = biometricData.length > 0;
    const hasAnyData = hasEnrollment || hasDemographic || hasBiometric;

    if (!hasAnyData) {
      return "No data uploaded yet. Please upload CSV files to get started.";
    }

    const totalEnrollments = stateData.reduce((sum, s) => sum + s.enrollments, 0);
    const totalDemographics = stateData.reduce((sum, s) => sum + s.demographics, 0);
    const totalBiometrics = stateData.reduce((sum, s) => sum + s.biometrics, 0);
    const grandTotal = totalEnrollments + totalDemographics + totalBiometrics;

    const allStates = [...new Set([
      ...enrollmentData.map(d => d.state),
      ...demographicData.map(d => d.state),
      ...biometricData.map(d => d.state),
    ])];

    const allDistricts = [...new Set([
      ...enrollmentData.map(d => d.district),
      ...demographicData.map(d => d.district),
      ...biometricData.map(d => d.district),
    ])];

    const allDates = [...new Set([
      ...enrollmentData.map(d => d.date),
      ...demographicData.map(d => d.date),
      ...biometricData.map(d => d.date),
    ])].filter(d => d && d !== 'undefined' && d !== 'null').sort();

    const allPincodes = [...new Set([
      ...enrollmentData.map(d => d.pincode),
      ...demographicData.map(d => d.pincode),
      ...biometricData.map(d => d.pincode),
    ])];

    const getDistrictData = (district: string) => {
      const enrollments = enrollmentData
        .filter(d => d.district.toLowerCase() === district.toLowerCase())
        .reduce((sum, d) => sum + d.age_0_5 + d.age_5_17 + d.age_18_greater, 0);
      const demographics = demographicData
        .filter(d => d.district.toLowerCase() === district.toLowerCase())
        .reduce((sum, d) => sum + d.demo_age_5_17 + d.demo_age_17_plus, 0);
      const biometrics = biometricData
        .filter(d => d.district.toLowerCase() === district.toLowerCase())
        .reduce((sum, d) => sum + d.bio_age_5_17 + d.bio_age_17_plus, 0);
      return { enrollments, demographics, biometrics, total: enrollments + demographics + biometrics };
    };

    const getStateDetailedData = (state: string) => {
      const enrollments = enrollmentData
        .filter(d => d.state.toLowerCase() === state.toLowerCase())
        .reduce((sum, d) => sum + d.age_0_5 + d.age_5_17 + d.age_18_greater, 0);
      const demographics = demographicData
        .filter(d => d.state.toLowerCase() === state.toLowerCase())
        .reduce((sum, d) => sum + d.demo_age_5_17 + d.demo_age_17_plus, 0);
      const biometrics = biometricData
        .filter(d => d.state.toLowerCase() === state.toLowerCase())
        .reduce((sum, d) => sum + d.bio_age_5_17 + d.bio_age_17_plus, 0);
      
      const districts = [...new Set([
        ...enrollmentData.filter(d => d.state.toLowerCase() === state.toLowerCase()).map(d => d.district),
        ...demographicData.filter(d => d.state.toLowerCase() === state.toLowerCase()).map(d => d.district),
        ...biometricData.filter(d => d.state.toLowerCase() === state.toLowerCase()).map(d => d.district),
      ])];
      
      return { enrollments, demographics, biometrics, total: enrollments + demographics + biometrics, districts };
    };

    const getDateData = (date: string) => {
      const enrollments = enrollmentData
        .filter(d => d.date === date)
        .reduce((sum, d) => sum + d.age_0_5 + d.age_5_17 + d.age_18_greater, 0);
      const demographics = demographicData
        .filter(d => d.date === date)
        .reduce((sum, d) => sum + d.demo_age_5_17 + d.demo_age_17_plus, 0);
      const biometrics = biometricData
        .filter(d => d.date === date)
        .reduce((sum, d) => sum + d.bio_age_5_17 + d.bio_age_17_plus, 0);
      return { enrollments, demographics, biometrics, total: enrollments + demographics + biometrics };
    };

    const getAgeBreakdown = () => {
      const age_0_5 = enrollmentData.reduce((sum, d) => sum + d.age_0_5, 0);
      const age_5_17_enroll = enrollmentData.reduce((sum, d) => sum + d.age_5_17, 0);
      const age_18_plus = enrollmentData.reduce((sum, d) => sum + d.age_18_greater, 0);
      const demo_5_17 = demographicData.reduce((sum, d) => sum + d.demo_age_5_17, 0);
      const demo_17_plus = demographicData.reduce((sum, d) => sum + d.demo_age_17_plus, 0);
      const bio_5_17 = biometricData.reduce((sum, d) => sum + d.bio_age_5_17, 0);
      const bio_17_plus = biometricData.reduce((sum, d) => sum + d.bio_age_17_plus, 0);
      return { age_0_5, age_5_17_enroll, age_18_plus, demo_5_17, demo_17_plus, bio_5_17, bio_17_plus };
    };

    if (q.includes('help') || q === '?') {
      return `I can help with:

• Totals - "total enrollments"
• Rankings - "top 5 states"
• State info - "tell me about Maharashtra"
• Age data - "age breakdown"
• Summary - "show summary"
• Compare - "compare Gujarat and Rajasthan"`;
    }

    if (q.includes('summary') || q.includes('overview') || q.includes('all data') || q === 'show all') {
      const ages = getAgeBreakdown();
      return `Data Summary

Coverage:
• ${allStates.length} States
• ${allDistricts.length} Districts
• ${allPincodes.length} Pincodes
${allDates.length > 0 ? `• ${allDates[0]} to ${allDates[allDates.length-1]}` : ''}

Totals:
• Enrollments: ${totalEnrollments.toLocaleString()}
• Demographics: ${totalDemographics.toLocaleString()}
• Biometrics: ${totalBiometrics.toLocaleString()}
• Grand Total: ${grandTotal.toLocaleString()}

Age Groups (Enrollment):
• 0-5 yrs: ${ages.age_0_5.toLocaleString()}
• 5-17 yrs: ${ages.age_5_17_enroll.toLocaleString()}
• 18+ yrs: ${ages.age_18_plus.toLocaleString()}`;
    }

    if (q.includes('total') || q.includes('how many') || q.includes('count')) {
      if (q.includes('enrollment')) {
        return `Total Enrollments: ${totalEnrollments.toLocaleString()}
Across ${allStates.length} states and ${allDistricts.length} districts`;
      }
      if (q.includes('demographic')) {
        return `Total Demographics: ${totalDemographics.toLocaleString()}
Across ${allStates.length} states and ${allDistricts.length} districts`;
      }
      if (q.includes('biometric')) {
        return `Total Biometrics: ${totalBiometrics.toLocaleString()}
Across ${allStates.length} states and ${allDistricts.length} districts`;
      }
      if (q.includes('state')) {
        return `${allStates.length} States in data:
${allStates.slice(0, 8).join(', ')}${allStates.length > 8 ? ` +${allStates.length - 8} more` : ''}`;
      }
      if (q.includes('district')) {
        return `${allDistricts.length} Districts across ${allStates.length} states`;
      }
      return `Total Records:
• Enrollments: ${totalEnrollments.toLocaleString()}
• Demographics: ${totalDemographics.toLocaleString()}
• Biometrics: ${totalBiometrics.toLocaleString()}
• Grand Total: ${grandTotal.toLocaleString()}`;
    }

    if (q.includes('age') || q.includes('breakdown') || q.includes('children') || q.includes('adult')) {
      const ages = getAgeBreakdown();
      return `Age Breakdown

Enrollments:
• Children (0-5): ${ages.age_0_5.toLocaleString()} (${((ages.age_0_5/totalEnrollments)*100).toFixed(1)}%)
• Youth (5-17): ${ages.age_5_17_enroll.toLocaleString()} (${((ages.age_5_17_enroll/totalEnrollments)*100).toFixed(1)}%)
• Adults (18+): ${ages.age_18_plus.toLocaleString()} (${((ages.age_18_plus/totalEnrollments)*100).toFixed(1)}%)

Demographics:
• Youth (5-17): ${ages.demo_5_17.toLocaleString()}
• Adults (17+): ${ages.demo_17_plus.toLocaleString()}

Biometrics:
• Youth (5-17): ${ages.bio_5_17.toLocaleString()}
• Adults (17+): ${ages.bio_17_plus.toLocaleString()}`;
    }

    if ((q.includes('top') || q.includes('best') || q.includes('highest')) && !q.includes('bottom') && !q.includes('lowest')) {
      const count = q.match(/\d+/)?.[0] ? parseInt(q.match(/\d+/)![0]) : 5;
      const sortedStates = [...stateData].sort((a, b) => (b.enrollments + b.demographics + b.biometrics) - (a.enrollments + a.demographics + a.biometrics));
      const topStates = sortedStates.slice(0, Math.min(count, sortedStates.length));
      const list = topStates.map((s, i) => 
        `${i + 1}. ${s.name}: ${(s.enrollments + s.demographics + s.biometrics).toLocaleString()}`
      ).join('\n');
      return `Top ${topStates.length} States:\n\n${list}`;
    }

    if (q.includes('bottom') || q.includes('lowest') || q.includes('least') || q.includes('worst')) {
      const count = q.match(/\d+/)?.[0] ? parseInt(q.match(/\d+/)![0]) : 5;
      const sortedStates = [...stateData].sort((a, b) => (a.enrollments + a.demographics + a.biometrics) - (b.enrollments + b.demographics + b.biometrics));
      const bottomStates = sortedStates.slice(0, Math.min(count, sortedStates.length));
      const list = bottomStates.map((s, i) => 
        `${i + 1}. ${s.name}: ${(s.enrollments + s.demographics + s.biometrics).toLocaleString()}`
      ).join('\n');
      return `Bottom ${bottomStates.length} States:\n\n${list}`;
    }

    if (q.includes('compare')) {
      const foundStates = allStates.filter(state => q.includes(state.toLowerCase()));
      if (foundStates.length >= 2) {
        const comparison = foundStates.slice(0, 2).map(state => {
          const data = getStateDetailedData(state);
          return `${state}:
• Enrollments: ${data.enrollments.toLocaleString()}
• Demographics: ${data.demographics.toLocaleString()}
• Biometrics: ${data.biometrics.toLocaleString()}
• Total: ${data.total.toLocaleString()}`;
        }).join('\n\n');
        return `Comparison:\n\n${comparison}`;
      }
      return "Mention two state names to compare.\nExample: Compare Maharashtra and Gujarat";
    }

    if (q.includes('average') || q.includes('avg') || q.includes('mean')) {
      const avgEnrollments = Math.round(totalEnrollments / stateData.length);
      const avgDemographics = Math.round(totalDemographics / stateData.length);
      const avgBiometrics = Math.round(totalBiometrics / stateData.length);
      return `Averages per State:

• Enrollments: ${avgEnrollments.toLocaleString()}
• Demographics: ${avgDemographics.toLocaleString()}
• Biometrics: ${avgBiometrics.toLocaleString()}
• Total: ${(avgEnrollments + avgDemographics + avgBiometrics).toLocaleString()}`;
    }

    if (q.includes('trend') || q.includes('growth') || q.includes('time') || q.includes('date range')) {
      if (allDates.length < 2) {
        return "Not enough date data for trends. Upload data with multiple dates.";
      }
      const firstDate = getDateData(allDates[0]);
      const lastDate = getDateData(allDates[allDates.length - 1]);
      return `Trend Analysis

Date Range: ${allDates[0]} to ${allDates[allDates.length - 1]}
Total Days: ${allDates.length}

First (${allDates[0]}): ${firstDate.total.toLocaleString()}
Latest (${allDates[allDates.length - 1]}): ${lastDate.total.toLocaleString()}`;
    }

    if (q.includes('list') && q.includes('state')) {
      return `All ${allStates.length} States:\n\n${allStates.join(', ')}`;
    }

    if (q.includes('list') && q.includes('district')) {
      const sample = allDistricts.slice(0, 15);
      return `Districts (${allDistricts.length} total):\n\n${sample.join(', ')}${allDistricts.length > 15 ? `\n\n...and ${allDistricts.length - 15} more` : ''}`;
    }

    const dateMatch = allDates.find(date => q.includes(date.toLowerCase()));
    if (dateMatch) {
      const dateData = getDateData(dateMatch);
      return `Data for ${dateMatch}:

• Enrollments: ${dateData.enrollments.toLocaleString()}
• Demographics: ${dateData.demographics.toLocaleString()}
• Biometrics: ${dateData.biometrics.toLocaleString()}
• Total: ${dateData.total.toLocaleString()}`;
    }

    const districtMatch = allDistricts.find(district => q.includes(district.toLowerCase()));
    if (districtMatch) {
      const districtData = getDistrictData(districtMatch);
      const parentState = enrollmentData.find(d => d.district.toLowerCase() === districtMatch.toLowerCase())?.state ||
                         demographicData.find(d => d.district.toLowerCase() === districtMatch.toLowerCase())?.state ||
                         biometricData.find(d => d.district.toLowerCase() === districtMatch.toLowerCase())?.state;
      return `${districtMatch}${parentState ? ` (${parentState})` : ''}

• Enrollments: ${districtData.enrollments.toLocaleString()}
• Demographics: ${districtData.demographics.toLocaleString()}
• Biometrics: ${districtData.biometrics.toLocaleString()}
• Total: ${districtData.total.toLocaleString()}`;
    }

    const stateMatch = allStates.find(state => q.includes(state.toLowerCase()));
    if (stateMatch) {
      const stateDetailedData = getStateDetailedData(stateMatch);
      const rank = [...stateData].sort((a, b) => (b.enrollments + b.demographics + b.biometrics) - (a.enrollments + a.demographics + a.biometrics))
        .findIndex(s => s.name.toLowerCase() === stateMatch.toLowerCase()) + 1;
      
      return `${stateMatch} (Rank #${rank})

Statistics:
• Enrollments: ${stateDetailedData.enrollments.toLocaleString()}
• Demographics: ${stateDetailedData.demographics.toLocaleString()}
• Biometrics: ${stateDetailedData.biometrics.toLocaleString()}
• Total: ${stateDetailedData.total.toLocaleString()}

Districts: ${stateDetailedData.districts.length}
${stateDetailedData.districts.length > 0 ? stateDetailedData.districts.slice(0, 4).join(', ') + (stateDetailedData.districts.length > 4 ? ` +${stateDetailedData.districts.length - 4} more` : '') : ''}`;
    }

    if (q.includes('percentage') || q.includes('percent') || q.includes('share') || q.includes('distribution')) {
      const enrollPct = ((totalEnrollments / grandTotal) * 100).toFixed(1);
      const demoPct = ((totalDemographics / grandTotal) * 100).toFixed(1);
      const bioPct = ((totalBiometrics / grandTotal) * 100).toFixed(1);
      return `Distribution:

• Enrollments: ${enrollPct}% (${totalEnrollments.toLocaleString()})
• Demographics: ${demoPct}% (${totalDemographics.toLocaleString()})
• Biometrics: ${bioPct}% (${totalBiometrics.toLocaleString()})`;
    }

    if (q.includes('record') || q.includes('row') || q.includes('data point')) {
      return `Data Records:

• Enrollment: ${enrollmentData.length.toLocaleString()}
• Demographic: ${demographicData.length.toLocaleString()}
• Biometric: ${biometricData.length.toLocaleString()}
• Total: ${(enrollmentData.length + demographicData.length + biometricData.length).toLocaleString()}`;
    }

    return `I have data for ${allStates.length} states and ${allDistricts.length} districts.

Try asking:
• "Show summary"
• "Top 5 states"
• "Tell me about [state name]"
• "Age breakdown"
• Type "help" for more options`;
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const response = analyzeData(input);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 400);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-[480px] bg-card border border-border rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              <span className="font-medium">Data Assistant</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 p-0 text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-line leading-relaxed ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {message.content}
                </div>
                {message.role === 'user' && (
                  <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2 justify-start">
                <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-border">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your data..."
                className="flex-1 h-9 text-sm"
              />
              <Button type="submit" size="sm" className="h-9 w-9 p-0" disabled={!input.trim() || isLoading}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
