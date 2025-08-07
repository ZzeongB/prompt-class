#!/usr/bin/env python3
"""
JH Log Analyzer
분석할 수 있는 항목들:
1. 이벤트 타입별 발생 빈도
2. 시간대별 활동 패턴
3. 세션별 활동 분석
4. 시스템 전환 패턴 (system1 vs system2)
5. 사용자 행동 패턴 분석
"""

import json
import re
from datetime import datetime
from collections import defaultdict, Counter
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

class JHLogAnalyzer:
    def __init__(self, log_file_path):
        self.log_file_path = log_file_path
        self.events = []
        self.parsed_events = []
        
    def parse_log_file(self):
        """로그 파일을 파싱하여 이벤트 추출"""
        with open(self.log_file_path, 'r', encoding='utf-8') as f:
            for line in f:
                if 'INFO - {' in line and '"event":' in line:
                    try:
                        # 타임스탬프와 JSON 부분 분리
                        timestamp_match = re.match(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3})', line)
                        if timestamp_match:
                            timestamp = timestamp_match.group(1)
                            
                        # JSON 부분 추출
                        json_start = line.find('{"timestamp"')
                        if json_start != -1:
                            json_str = line[json_start:].strip()
                            # HTTP 로그 부분 제거
                            if '" 200 -' in json_str:
                                json_str = json_str.split('" 200 -')[0] + '"}'
                            
                            event_data = json.loads(json_str)
                            event_data['log_timestamp'] = timestamp
                            self.events.append(event_data)
                            
                    except (json.JSONDecodeError, AttributeError) as e:
                        continue
                        
        print(f"총 {len(self.events)}개의 이벤트를 파싱했습니다.")
        
    def analyze_event_types(self):
        """이벤트 타입별 분석"""
        event_counts = Counter([event['event'] for event in self.events])
        
        print("\n=== 이벤트 타입별 발생 빈도 ===")
        for event_type, count in event_counts.most_common():
            print(f"{event_type}: {count}회")
            
        return event_counts
    
    def analyze_user_sessions(self):
        """사용자 세션별 분석"""
        session_events = defaultdict(list)
        
        for event in self.events:
            if 'details' in event and 'session_id' in event['details']:
                session_id = event['details']['session_id']
                session_events[session_id].append(event)
                
        print(f"\n=== 세션 분석 ===")
        print(f"총 세션 수: {len(session_events)}")
        
        for session_id, events in session_events.items():
            print(f"\n세션 {session_id[:8]}...")
            print(f"  이벤트 수: {len(events)}")
            print(f"  시작 시간: {events[0].get('timestamp', 'N/A')}")
            print(f"  종료 시간: {events[-1].get('timestamp', 'N/A')}")
            
            # 세션 내 이벤트 타입 분석
            session_event_types = Counter([e['event'] for e in events])
            print(f"  주요 활동: {dict(session_event_types.most_common(3))}")
            
        return session_events
    
    def analyze_system_switches(self):
        """시스템 전환 패턴 분석"""
        system_switches = [e for e in self.events if e['event'] == 'system_switch']
        
        print(f"\n=== 시스템 전환 분석 ===")
        print(f"총 시스템 전환 수: {len(system_switches)}")
        
        system_usage = Counter()
        for switch in system_switches:
            if 'details' in switch and 'new_system' in switch['details']:
                system_usage[switch['details']['new_system']] += 1
                
        print("시스템별 전환 횟수:")
        for system, count in system_usage.items():
            print(f"  {system}: {count}회")
            
        return system_switches
    
    def analyze_time_patterns(self):
        """시간대별 활동 패턴 분석"""
        hours = []
        
        for event in self.events:
            if 'timestamp' in event:
                try:
                    # ISO 형식 타임스탬프 파싱
                    dt = datetime.fromisoformat(event['timestamp'].replace('Z', '+00:00'))
                    hours.append(dt.hour)
                except:
                    continue
                    
        if hours:
            hour_counts = Counter(hours)
            
            print(f"\n=== 시간대별 활동 패턴 ===")
            print("시간대별 활동량:")
            for hour in sorted(hour_counts.keys()):
                print(f"  {hour:02d}시: {hour_counts[hour]}회 {'█' * (hour_counts[hour] // 10)}")
                
        return hours
    
    def analyze_user_behavior(self):
        """사용자 행동 패턴 분석"""
        print(f"\n=== 사용자 행동 패턴 분석 ===")
        
        # 레이아웃 관련 활동
        layout_events = [e for e in self.events if 'layout' in e['event'].lower()]
        print(f"레이아웃 관련 활동: {len(layout_events)}회")
        
        # 인스턴스 관련 활동
        instance_events = [e for e in self.events if 'instance' in e['event'].lower()]
        print(f"인스턴스 관련 활동: {len(instance_events)}회")
        
        # 클래스 관련 활동
        class_events = [e for e in self.events if 'class' in e['event'].lower()]
        print(f"클래스 관련 활동: {len(class_events)}회")
        
        # API 호출 분석
        api_events = [e for e in self.events if e['event'].startswith('api.')]
        print(f"API 호출: {len(api_events)}회")
        
        api_types = Counter([e['event'] for e in api_events])
        print("API 호출 유형:")
        for api_type, count in api_types.items():
            print(f"  {api_type}: {count}회")
    
    def generate_timeline(self, limit=50):
        """이벤트 타임라인 생성"""
        print(f"\n=== 이벤트 타임라인 (최근 {limit}개) ===")
        
        recent_events = self.events[-limit:] if len(self.events) > limit else self.events
        
        for event in recent_events:
            timestamp = event.get('timestamp', 'N/A')
            event_type = event.get('event', 'N/A')
            details = event.get('details', {})
            
            # 주요 정보 추출
            info_parts = []
            if 'user_id' in details:
                info_parts.append(f"user:{details['user_id']}")
            if 'new_system' in details:
                info_parts.append(f"→{details['new_system']}")
            if 'instanceLabel' in details:
                info_parts.append(f"label:{details['instanceLabel']}")
            if 'nodeId' in details:
                info_parts.append(f"node:{details['nodeId'][:10]}...")
                
            info_str = " | ".join(info_parts) if info_parts else ""
            print(f"{timestamp} | {event_type:30} | {info_str}")
    
    def save_analysis_report(self, output_file='jh_log_analysis_report.txt'):
        """분석 결과를 파일로 저장"""
        import sys
        from io import StringIO
        
        # stdout을 임시로 StringIO로 리다이렉트
        old_stdout = sys.stdout
        sys.stdout = report_output = StringIO()
        
        try:
            print("JH 로그 분석 보고서")
            print("=" * 50)
            print(f"분석 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"로그 파일: {self.log_file_path}")
            print(f"총 이벤트 수: {len(self.events)}")
            
            self.analyze_event_types()
            self.analyze_user_sessions()
            self.analyze_system_switches()
            self.analyze_time_patterns()
            self.analyze_user_behavior()
            self.generate_timeline()
            
        finally:
            sys.stdout = old_stdout
            
        # 보고서 내용을 파일로 저장
        report_content = report_output.getvalue()
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
            
        print(f"분석 보고서가 {output_file}에 저장되었습니다.")
        return report_content
    
    def run_full_analysis(self):
        """전체 분석 실행"""
        print("JH 로그 분석을 시작합니다...")
        self.parse_log_file()
        
        if not self.events:
            print("분석할 이벤트가 없습니다.")
            return
            
        self.analyze_event_types()
        self.analyze_user_sessions() 
        self.analyze_system_switches()
        self.analyze_time_patterns()
        self.analyze_user_behavior()
        self.generate_timeline()

# 사용 예시
if __name__ == "__main__":
    # 로그 파일 경로
    log_file = "backend/logs/jh.log"
    
    # 분석기 생성 및 실행
    analyzer = JHLogAnalyzer(log_file)
    analyzer.run_full_analysis()
    
    # 분석 보고서 저장
    analyzer.save_analysis_report()
    
    print("\n분석이 완료되었습니다!")