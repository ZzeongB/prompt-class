#!/usr/bin/env python3
"""
Class & Instance 활동 분석기
클래스와 인스턴스 관련 이벤트만 추출하고 분석
"""

import json
import re
from datetime import datetime
from collections import defaultdict, Counter

class ClassInstanceAnalyzer:
    def __init__(self, log_file_path):
        self.log_file_path = log_file_path
        self.all_events = []
        self.class_instance_events = []
        
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
                            self.all_events.append(event_data)
                            
                    except (json.JSONDecodeError, AttributeError) as e:
                        continue
                        
        print(f"총 {len(self.all_events)}개의 이벤트를 파싱했습니다.")
        
    def filter_class_instance_events(self):
        """클래스와 인스턴스 관련 이벤트만 필터링"""
        keywords = ['class', 'instance']
        
        for event in self.all_events:
            event_type = event.get('event', '').lower()
            
            # 기본 클래스/인스턴스 키워드 매칭
            if any(keyword in event_type for keyword in keywords):
                self.class_instance_events.append(event)
            # object_node 이벤트에서 is_class_mode가 true인 경우도 포함
            elif event_type.startswith('object_node.') and event.get('details', {}).get('is_class_mode'):
                self.class_instance_events.append(event)
                
        print(f"클래스/인스턴스 관련 이벤트: {len(self.class_instance_events)}개")
        
    def analyze_class_events(self):
        """클래스 관련 이벤트 분석"""
        class_events = []
        for e in self.class_instance_events:
            event_type = e['event'].lower()
            # 기본 클래스 이벤트 또는 클래스 모드의 object_node 이벤트
            if 'class' in event_type or (event_type.startswith('object_node.') and e.get('details', {}).get('is_class_mode')):
                class_events.append(e)
        
        print(f"\n=== 클래스 관련 이벤트 ({len(class_events)}개) ===")
        
        class_event_types = Counter([e['event'] for e in class_events])
        for event_type, count in class_event_types.items():
            print(f"  {event_type}: {count}회")
            
        return class_events
    
    def analyze_instance_events(self):
        """인스턴스 관련 이벤트 분석"""
        instance_events = []
        for e in self.class_instance_events:
            event_type = e['event'].lower()
            # 기본 인스턴스 이벤트 또는 인스턴스 모드의 object_node 이벤트
            if 'instance' in event_type or (event_type.startswith('object_node.') and not e.get('details', {}).get('is_class_mode')):
                instance_events.append(e)
        
        print(f"\n=== 인스턴스 관련 이벤트 ({len(instance_events)}개) ===")
        
        instance_event_types = Counter([e['event'] for e in instance_events])
        for event_type, count in instance_event_types.items():
            print(f"  {event_type}: {count}회")
            
        return instance_events
    
    def list_all_events(self):
        """모든 클래스/인스턴스 이벤트를 시간순으로 나열"""
        print(f"\n=== 클래스/인스턴스 이벤트 타임라인 ===")
        
        for i, event in enumerate(self.class_instance_events, 1):
            timestamp = event.get('timestamp', 'N/A')
            event_type = event.get('event', 'N/A')
            details = event.get('details', {})
            
            print(f"\n[{i:3d}] {timestamp}")
            print(f"     이벤트: {event_type}")
            
            # 주요 정보 출력
            if 'class_id' in details:
                print(f"     클래스 ID: {details['class_id']}")
            if 'class_name' in details:
                print(f"     클래스 이름: {details['class_name']}")
            if 'instanceId' in details:
                print(f"     인스턴스 ID: {details['instanceId']}")
            if 'instance_id' in details:
                print(f"     인스턴스 ID: {details['instance_id']}")
            if 'instanceLabel' in details:
                print(f"     인스턴스 라벨: {details['instanceLabel']}")
            if 'instance_label' in details:
                print(f"     인스턴스 라벨: {details['instance_label']}")
            if 'placeholder_count' in details:
                print(f"     플레이스홀더 수: {details['placeholder_count']}")
            if 'object_count' in details:
                print(f"     오브젝트 수: {details['object_count']}")
            if 'created_from' in details:
                print(f"     생성 소스: {details['created_from']}")
                
            # object_node 이벤트 전용 정보
            if event_type.startswith('object_node.'):
                if 'object_id' in details:
                    print(f"     오브젝트 ID: {details['object_id']}")
                if 'object_name' in details:
                    print(f"     오브젝트 이름: {details['object_name']}")
                if 'edit_mode' in details:
                    print(f"     편집 모드: {details['edit_mode']}")
                if 'new_value' in details:
                    print(f"     새 값: {details['new_value']}")
                if 'is_class_mode' in details:
                    mode = "클래스 모드" if details['is_class_mode'] else "인스턴스 모드"
                    print(f"     모드: {mode}")
                    
            if 'session_id' in details:
                print(f"     세션: {details['session_id'][:8]}...")
            if 'user_id' in details:
                print(f"     사용자: {details['user_id']}")
    
    def save_to_file(self, output_file='class_instance_events.json'):
        """클래스/인스턴스 이벤트를 JSON 파일로 저장"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.class_instance_events, f, indent=2, ensure_ascii=False)
        print(f"\n클래스/인스턴스 이벤트가 {output_file}에 저장되었습니다.")
        
    def save_readable_report(self, output_file='class_instance_report.txt'):
        """읽기 쉬운 형태의 보고서 저장"""
        import sys
        from io import StringIO
        
        # stdout을 임시로 StringIO로 리다이렉트
        old_stdout = sys.stdout
        sys.stdout = report_output = StringIO()
        
        try:
            print("클래스 & 인스턴스 활동 분석 보고서")
            print("=" * 60)
            print(f"분석 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"로그 파일: {self.log_file_path}")
            print(f"전체 이벤트 수: {len(self.all_events)}")
            print(f"클래스/인스턴스 이벤트 수: {len(self.class_instance_events)}")
            
            self.analyze_class_events()
            self.analyze_instance_events()
            self.list_all_events()
            
        finally:
            sys.stdout = old_stdout
            
        # 보고서 내용을 파일로 저장
        report_content = report_output.getvalue()
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(report_content)
            
        print(f"분석 보고서가 {output_file}에 저장되었습니다.")
    
    def run_analysis(self):
        """전체 분석 실행"""
        print("클래스/인스턴스 이벤트 분석을 시작합니다...")
        self.parse_log_file()
        self.filter_class_instance_events()
        
        if not self.class_instance_events:
            print("분석할 클래스/인스턴스 이벤트가 없습니다.")
            return
            
        self.analyze_class_events()
        self.analyze_instance_events()
        self.list_all_events()
        
        # 파일로 저장
        self.save_to_file()
        self.save_readable_report()

# 사용 예시
if __name__ == "__main__":
    # 로그 파일 경로
    log_file = "backend/logs/jh.log"
    
    # 분석기 생성 및 실행
    analyzer = ClassInstanceAnalyzer(log_file)
    analyzer.run_analysis()
    
    print("\n분석이 완료되었습니다!")
    print("생성된 파일:")
    print("- class_instance_events.json (JSON 형태)")
    print("- class_instance_report.txt (읽기 쉬운 보고서)")