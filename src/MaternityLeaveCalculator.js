import React, { useState, useEffect } from 'react';

const MaternityLeaveCalculator = () => {
  // 状態変数の定義
  const [payrollSettings, setPayrollSettings] = useState({
    cutoffDay: 'end', // 'end' or a number (1-28)
    paymentDay: 10,   // 支払日（1-31）
    paymentMonth: 'next', // 'current' or 'next'
  });

  // const defaultBirthDate = '2024-07-30'; // 7月30日
  // const defaultLeaveDate = '2024-09-25'; // 9月25日

  // const [birthDate, setBirthDate] = useState(defaultBirthDate);
  // const [leaveStartDate, setLeaveStartDate] = useState(defaultLeaveDate);
  // const [monthlySalary, setMonthlySalary] = useState('260550');
const [birthDate, setBirthDate] = useState(''); // 空の文字列に変更
const [leaveStartDate, setLeaveStartDate] = useState(''); // 空の文字列に変更
const [monthlySalary, setMonthlySalary] = useState(''); // 空の文字列に変更
  // 計算結果
  const [calculations, setCalculations] = useState({
    salary80Percent: 0,
    salary67Percent: 0,
    salary50Percent: 0,
    salary30Percent: 0,
    salary13Percent: 0,
  });

  // 申請期間とその他の情報
  const [periods, setPeriods] = useState([]);
  
  // 育休開始日が出産日に基づいて自動計算される（産後8週間後）
// 育休開始日が出産日に基づいて自動計算される（産後8週間後）
useEffect(() => {
  if (birthDate) { // birthDateが空でない場合のみ実行
    const birthDateObj = new Date(birthDate);
    // 産後8週間（56日）
    const calculatedStartDate = new Date(birthDateObj);
    calculatedStartDate.setDate(birthDateObj.getDate() + 57);
    
    // フォーマット変換
    const year = calculatedStartDate.getFullYear();
    const month = String(calculatedStartDate.getMonth() + 1).padStart(2, '0');
    const day = String(calculatedStartDate.getDate()).padStart(2, '0');
    
    setLeaveStartDate(`${year}-${month}-${day}`);
  }
}, [birthDate]);

  // 賃金月額から各割合の計算
  useEffect(() => {
    if (monthlySalary && !isNaN(parseFloat(monthlySalary))) {
      const salary = parseFloat(monthlySalary);
      setCalculations({
        salary80Percent: Math.floor(salary * 0.8),
        salary67Percent: Math.floor(salary * 0.67),
        salary50Percent: Math.floor(salary * 0.5),
        salary30Percent: Math.floor(salary * 0.3),
        salary13Percent: Math.floor(salary * 0.13),
      });
    }
  }, [monthlySalary]);

  // 支給期間と申請時期の計算
  useEffect(() => {
    if (birthDate && leaveStartDate && monthlySalary) {
      const birth = new Date(birthDate);
      const leaveStart = new Date(leaveStartDate);
      
      // 子供の1歳の誕生日（出産日から1年後）
      const firstBirthday = new Date(birth);
      firstBirthday.setFullYear(firstBirthday.getFullYear() + 1);
      
      // 1歳の誕生日の前々日（育休給付金の終了日）
      const endDate = new Date(firstBirthday);
      endDate.setDate(endDate.getDate() - 2);
      
      // 支給期間と申請期間の計算ロジック
      const newPeriods = [];
      
      // 育休開始日の日付を取得
      const startDay = leaveStart.getDate();
      
      // 1歳の誕生日の前々日までの支給単位期間を計算
      let currentPeriodStart = new Date(leaveStart);
      
      while (currentPeriodStart <= endDate) {
        // 期間開始日
        const periodStart = new Date(currentPeriodStart);
        
        // 期間終了日の計算（翌月の同日の前日）
        const nextMonth = new Date(periodStart);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        
        // 翌月に同じ日付があるかどうかをチェック
        const lastDayOfNextMonth = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1 + 1, 0).getDate();
        
        let periodEnd;
        if (startDay > lastDayOfNextMonth) {
          // 翌月に同じ日付がない場合（例：1/31→2月は28日まで）
          // 翌月の最終日の前日を終了日とする
          periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, lastDayOfNextMonth - 1);
        } else {
          // 翌月に同じ日付がある場合、翌月の同日の前日を終了日とする
          periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, startDay - 1);
        }
        
        // 期間終了日が1歳の前々日を超える場合、1歳の前々日までに調整
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
        }
        
        // 生後月齢の計算
        const babyMonths = (periodStart.getFullYear() - birth.getFullYear()) * 12 + 
                          periodStart.getMonth() - birth.getMonth();
                          
        // 申請時期の計算（期間終了後）
        const applicationDate = new Date(periodEnd);
        applicationDate.setDate(applicationDate.getDate() + 1);
        
        // 各期間の給与締め日を計算
        // この期間に含まれる締め日（複数ある場合は最後のもの）を見つける
        let cutoffDate;
        
        // 期間内の全ての日をチェック
        let checkDate = new Date(periodStart);
        while (checkDate <= periodEnd) {
          // この日が締め日かどうかチェック
          if (payrollSettings.cutoffDay === 'end') {
            // 月末締めの場合、月の最終日かどうか
            const lastDayOfMonth = new Date(checkDate.getFullYear(), checkDate.getMonth() + 1, 0).getDate();
            if (checkDate.getDate() === lastDayOfMonth) {
              cutoffDate = new Date(checkDate);
            }
          } else {
            // 指定日締めの場合
            const cutoffDay = parseInt(payrollSettings.cutoffDay, 10);
            if (checkDate.getDate() === cutoffDay) {
              cutoffDate = new Date(checkDate);
            }
          }
          
          // 次の日に進む
          checkDate.setDate(checkDate.getDate() + 1);
        }
        
        // 期間内に締め日がない場合、次の締め日を見つける
        if (!cutoffDate) {
          cutoffDate = new Date(periodEnd);
          if (payrollSettings.cutoffDay === 'end') {
            // 月末締めの場合、次の月末
            cutoffDate = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() + 1, 0);
          } else {
            // 指定日締めの場合
            const cutoffDay = parseInt(payrollSettings.cutoffDay, 10);
            cutoffDate = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth(), cutoffDay);
            
            // 締め日が期間終了日より前の場合、翌月の締め日に
            if (cutoffDate < periodEnd) {
              cutoffDate = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() + 1, cutoffDay);
            }
          }
        }
        
        // 支払日の計算
        let paymentSchedule;
        
        if (payrollSettings.paymentDay === 'end') {
          // 支払日が月末の場合
          if (payrollSettings.paymentMonth === 'next') {
            // 翌月払いの場合、締め日の翌月の月末
            paymentSchedule = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() + 2, 0);
          } else {
            // 当月払いの場合、締め日と同じ月の月末
            // ただし締め日自体が月末の場合は、翌月末
            if (cutoffDate.getDate() === new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() + 1, 0).getDate()) {
              paymentSchedule = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() + 2, 0);
            } else {
              paymentSchedule = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() + 1, 0);
            }
          }
        } else {
          // 支払日が指定日の場合
          const paymentDay = parseInt(payrollSettings.paymentDay, 10);
          paymentSchedule = new Date(cutoffDate);
          
          if (payrollSettings.paymentMonth === 'next') {
            // 翌月払いの場合
            paymentSchedule = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() + 1, paymentDay);
          } else {
            // 当月払いの場合
            paymentSchedule = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth(), paymentDay);
            // 支払日が締め日より前の場合、次の月の支払日に
            if (paymentSchedule < cutoffDate) {
              paymentSchedule = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth() + 1, paymentDay);
            }
          }
          
          // 支払日がその月に存在しない場合（例：31日が指定されているが30日までしかない月）
          // その月の最終日を使用
          const lastDayOfMonth = new Date(paymentSchedule.getFullYear(), paymentSchedule.getMonth() + 1, 0).getDate();
          if (paymentDay > lastDayOfMonth) {
            paymentSchedule = new Date(paymentSchedule.getFullYear(), paymentSchedule.getMonth() + 1, 0);
          }
        }
        
        // 支給率の決定（生後8ヶ月以降は67%から50%に変更）
        const payRate = babyMonths >= 8 ? 50 : 67;
        
        // 就労可能な金額の計算（生後8ヶ月以降は月収の30%まで、それ以前は13%まで）
        const workableAmount = babyMonths >= 8 ? calculations.salary30Percent : calculations.salary13Percent;
        
        newPeriods.push({
          periodStart: formatDate(periodStart),
          periodEnd: formatDate(periodEnd),
          cutoffDate: formatDate(cutoffDate),
          babyMonths,
          applicationDate: formatDate(applicationDate),
          paymentSchedule: formatDate(paymentSchedule),
          payRate,
          workableAmount,
          rateChangeIndex: babyMonths >= 8 ? 1 : 0, // 支給率変更のインデックス（0=67%, 1=50%）
        });
        
        // 次の期間の開始日を設定（現在の期間終了日の翌日）
        currentPeriodStart = new Date(periodEnd);
        currentPeriodStart.setDate(currentPeriodStart.getDate() + 1);
        
        // 次の開始日が1歳の誕生日の前々日を超えている場合、ループを終了
        if (currentPeriodStart > endDate) {
          break;
        }
      }
      
      setPeriods(newPeriods);
    }
  }, [birthDate, leaveStartDate, monthlySalary, calculations, payrollSettings]);

  // 日付関連のユーティリティ関数
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };
  
  // 日割り計算のための日数比率を計算する関数
  const getDaysRatio = (startDateStr, endDateStr) => {
    const startDate = new Date(startDateStr.replace(/\//g, '-'));
    const endDate = new Date(endDateStr.replace(/\//g, '-'));
    
    // 日数の差分 + 1（開始日も含める）
    const days = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // 月の日数で割る（平均30日と仮定）
    return days / 30;
  };

  // 締め日の選択肢
  const cutoffDayOptions = [
    { value: 'end', label: '月末' },
    ...Array.from({ length: 28 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}日` }))
  ];

  // 支払日の選択肢
  const paymentDayOptions = [
    { value: 'end', label: '月末' },
    ...Array.from({ length: 31 }, (_, i) => ({ 
      value: String(i + 1), 
      label: `${i + 1}日` 
    }))
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-6">育休給付金シミュレーター</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* 会社の締め日・支払日設定 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">会社の給与設定</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">給与締め日</label>
            <select 
              className="w-full p-2 border rounded"
              value={payrollSettings.cutoffDay}
              onChange={(e) => {
                const newSettings = {...payrollSettings, cutoffDay: e.target.value};
                setPayrollSettings(newSettings);
              }}
            >
              {cutoffDayOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">給与支払日</label>
            <select 
              className="w-full p-2 border rounded"
              value={payrollSettings.paymentDay}
              onChange={(e) => {
                const newSettings = {...payrollSettings, paymentDay: e.target.value};
                setPayrollSettings(newSettings);
              }}
            >
              {paymentDayOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">支払いタイミング</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMonth"
                  value="current"
                  checked={payrollSettings.paymentMonth === 'current'}
                  onChange={() => {
                    const newSettings = {...payrollSettings, paymentMonth: 'current'};
                    setPayrollSettings(newSettings);
                  }}
                  className="mr-2"
                />
                当月払い
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="paymentMonth"
                  value="next"
                  checked={payrollSettings.paymentMonth === 'next'}
                  onChange={() => {
                    const newSettings = {...payrollSettings, paymentMonth: 'next'};
                    setPayrollSettings(newSettings);
                  }}
                  className="mr-2"
                />
                翌月払い
              </label>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              例: 「月末締め翌月10日払い」の場合は、締め日=月末、支払日=10、支払いタイミング=翌月払い
            </p>
          </div>
        </div>
        
        {/* 個人情報設定 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">個人情報</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">出産予定日</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">育休開始日</label>
            <input 
              type="date" 
              className="w-full p-2 border rounded"
              value={leaveStartDate}
              onChange={(e) => setLeaveStartDate(e.target.value)}
            />
            <p className="text-sm text-gray-500 mt-1">
              デフォルトは産後8週間後（56日後）
            </p>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">賃金月額（円）</label>
            <input 
              type="number" 
              className="w-full p-2 border rounded"
              value={monthlySalary}
              onChange={(e) => setMonthlySalary(e.target.value)}
              placeholder="例: 260000"
            />
          </div>
        </div>
      </div>
      
      {/* 計算結果表示 */}
      {monthlySalary && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">賃金月額に基づく計算</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">割合</th>
                  <th className="py-2 px-4 border">金額（円）</th>
                  <th className="py-2 px-4 border">説明</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 px-4 border">80%</td>
                  <td className="py-2 px-4 border">{calculations.salary80Percent.toLocaleString()}</td>
                  <td className="py-2 px-4 border">これ以上支給されたら給付金なし</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">67%</td>
                  <td className="py-2 px-4 border">{calculations.salary67Percent.toLocaleString()}</td>
                  <td className="py-2 px-4 border">育休6か月（生後8か月）頃まで</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">50%</td>
                  <td className="py-2 px-4 border">{calculations.salary50Percent.toLocaleString()}</td>
                  <td className="py-2 px-4 border">育休6か月以降（生後8か月以降）</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">30%</td>
                  <td className="py-2 px-4 border">{calculations.salary30Percent.toLocaleString()}</td>
                  <td className="py-2 px-4 border">育休6か月以降、賃金この額までなら全額支給</td>
                </tr>
                <tr>
                  <td className="py-2 px-4 border">13%</td>
                  <td className="py-2 px-4 border">{calculations.salary13Percent.toLocaleString()}</td>
                  <td className="py-2 px-4 border">育休6か月まで、賃金この額までなら全額支給</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 申請期間表示 */}
      {birthDate && leaveStartDate && monthlySalary && periods.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">申請期間と給付金シミュレーション</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border">期間</th>
                  <th className="py-2 px-4 border">子の月齢</th>
                  <th className="py-2 px-4 border">申請目安</th>
                  <th className="py-2 px-4 border">給与締め日</th>
                  <th className="py-2 px-4 border">支給予定日</th>
                  <th className="py-2 px-4 border">支給率</th>
                  <th className="py-2 px-4 border">給付金額（目安）</th>
                  <th className="py-2 px-4 border">就労可能額</th>
                </tr>
              </thead>
              <tbody>
                {/* 生後8ヶ月未満 */}
                {periods.filter(p => p.rateChangeIndex === 0).length > 0 && (
                  <>
                    {periods.filter(p => p.rateChangeIndex === 0).map((period, index) => (
                      <tr key={`before-${index}`} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 border">
                          {period.periodStart} 〜 {period.periodEnd}
                        </td>
                        <td className="py-2 px-4 border">
                          {period.babyMonths}ヶ月
                        </td>
                        <td className="py-2 px-4 border">
                          {period.applicationDate}以降
                        </td>
                        <td className="py-2 px-4 border">
                          {period.cutoffDate}
                        </td>
                        <td className="py-2 px-4 border">
                          {period.paymentSchedule}
                        </td>
                        {index === 0 && (
                          <>
                            <td className="py-2 px-4 border text-center bg-blue-50" rowSpan={periods.filter(p => p.rateChangeIndex === 0).length}>
                              <span className="font-semibold">67%</span>
                              <p className="text-xs text-gray-600">育休開始〜6ヶ月（生後8ヶ月）まで</p>
                            </td>
                            <td className="py-2 px-4 border text-center bg-blue-50" rowSpan={periods.filter(p => p.rateChangeIndex === 0).length}>
                              <span className="font-semibold">{Math.floor(parseFloat(monthlySalary) * 0.67).toLocaleString()}円</span>
                              <p className="text-xs text-gray-600">賃金月額の67%</p>
                            </td>
                            <td className="py-2 px-4 border text-center bg-blue-50" rowSpan={periods.filter(p => p.rateChangeIndex === 0).length}>
                              <span className="font-semibold">{calculations.salary13Percent.toLocaleString()}円まで</span>
                              <p className="text-xs text-gray-600">賃金月額の13%まで就労可能</p>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </>
                )}
                
                {/* 生後8ヶ月以降 */}
                {periods.filter(p => p.rateChangeIndex === 1).length > 0 && (
                  <>
                    {periods.filter(p => p.rateChangeIndex === 1).map((period, index) => (
                      <tr key={`after-${index}`} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                        <td className="py-2 px-4 border">
                          {period.periodStart} 〜 {period.periodEnd}
                        </td>
                        <td className="py-2 px-4 border">
                          {period.babyMonths}ヶ月
                        </td>
                        <td className="py-2 px-4 border">
                          {period.applicationDate}以降
                        </td>
                        <td className="py-2 px-4 border">
                          {period.cutoffDate}
                        </td>
                        <td className="py-2 px-4 border">
                          {period.paymentSchedule}
                        </td>
                        {index === 0 && (
                          <>
                            <td className="py-2 px-4 border text-center bg-green-50" rowSpan={periods.filter(p => p.rateChangeIndex === 1).length}>
                              <span className="font-semibold">50%</span>
                              <p className="text-xs text-gray-600">育休6ヶ月（生後8ヶ月）以降</p>
                            </td>
                            <td className="py-2 px-4 border text-center bg-green-50" rowSpan={periods.filter(p => p.rateChangeIndex === 1).length}>
                              <span className="font-semibold">{Math.floor(parseFloat(monthlySalary) * 0.5).toLocaleString()}円</span>
                              <p className="text-xs text-gray-600">賃金月額の50%</p>
                            </td>
                            <td className="py-2 px-4 border text-center bg-green-50" rowSpan={periods.filter(p => p.rateChangeIndex === 1).length}>
                              <span className="font-semibold">{calculations.salary30Percent.toLocaleString()}円まで</span>
                              <p className="text-xs text-gray-600">賃金月額の30%まで就労可能</p>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800">注意事項</h3>
            <ul className="list-disc pl-5 mt-2 text-sm text-yellow-800 text-left">
              <li>このシミュレーターは参考情報です。賃金日額の上限額（15,690円）と下限額（2,869円）は考慮されていません。</li>
              <li>就労可能額を超えて就労した場合、給付金が減額または不支給となる場合があります。</li>
              <li>育児休業期間中は本来お子様との時間を大切にするものです。必要以上の就労は避け、心身の健康と育児のバランスを優先しましょう。</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaternityLeaveCalculator;