#!/usr/bin/env python3
"""
클래스/인스턴스 이벤트를 매트릭스 형태로 표시
- 행: class/instance ID
- 열: timestamp
- 비슷한 timestamp의 이벤트들을 근처에 배치
"""

import json
import pandas as pd
from datetime import datetime
from collections import defaultdict
import re

class TimelineMatrix:
    def __init__(self, events_file):
        self.events_file = events_file
        self.events = []
        self.entity_events = defaultdict(list)  # entity_id -> events
        self.timestamps = set()
        
    def load_events(self):
        """JSON 이벤트 파일 로드 (hovered 제외)"""
        with open(self.events_file, 'r', encoding='utf-8') as f:
            all_events = json.load(f)
        
        # hovered 이벤트 제외
        self.events = [event for event in all_events if 'hovered' not in event.get('event', '')]
        
        print(f"총 {len(all_events)}개의 이벤트 중 {len(self.events)}개를 로드했습니다. (hovered 이벤트 {len(all_events) - len(self.events)}개 제외)")
    
    def extract_entity_events(self):
        """각 엔티티별로 이벤트 분류"""
        current_active_class = None  # 현재 활성 클래스 추적
        
        for event in self.events:
            event_type = event.get('event', '')
            details = event.get('details', {})
            timestamp = event.get('timestamp', '')
            
            # 타임스탬프를 간단한 형태로 변환
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                time_key = dt.strftime('%H:%M:%S')
            except:
                time_key = timestamp[-8:] if len(timestamp) >= 8 else timestamp
            
            self.timestamps.add(time_key)
            
            # Instance 이벤트
            instance_id = details.get('instance_id') or details.get('instanceId')
            if instance_id:
                entity_key = f"I:{instance_id}"
                content = self.get_event_content(event, 'instance')
                if content:
                    self.entity_events[entity_key].append({
                        'timestamp': time_key,
                        'content': content,
                        'event_type': event_type,
                        'raw_event': event
                    })
            
            # Class 이벤트
            class_id = details.get('class_id')
            if class_id:
                entity_key = f"C:{class_id}"
                content = self.get_event_content(event, 'class')
                if content:
                    self.entity_events[entity_key].append({
                        'timestamp': time_key,
                        'content': content,
                        'event_type': event_type,
                        'raw_event': event
                    })
                    
                # 클래스 상세 열기나 생성시 현재 활성 클래스 업데이트
                if event_type in ['class_detail_opened', 'class.created']:
                    current_active_class = class_id
            
            # Object node 이벤트 - 현재 활성 클래스에만 연결
            elif (event_type.startswith('object_node.') and 
                  details.get('is_class_mode') and 
                  current_active_class):
                entity_key = f"C:{current_active_class}"
                content = self.get_event_content(event, 'object_node')
                if content:
                    self.entity_events[entity_key].append({
                        'timestamp': time_key,
                        'content': content,
                        'event_type': event_type,
                        'raw_event': event
                    })
        
        print(f"엔티티별 이벤트 분류 완료: {len(self.entity_events)}개 엔티티")
    
    def get_event_content(self, event, context):
        """이벤트 내용 생성"""
        event_type = event.get('event', '')
        details = event.get('details', {})
        
        if context == 'instance':
            if event_type == 'instance.edit.started':
                return f"✏️ Edit"
            elif event_type == 'instance.updated':
                text_changed = "T" if details.get('text_changed') else ""
                graph_changed = "G" if details.get('graph_changed') else ""
                changes = f"{text_changed}{graph_changed}" if text_changed or graph_changed else ""
                return f"💾 Save({changes})"
            elif event_type == 'instance.created_from_class':
                class_name = details.get('class_name', 'Unknown')[:8]
                return f"🎭 From {class_name}"
            elif event_type == 'instance_selected':
                return f"👆 Select"
            elif event_type == 'instance_deselected':
                return f"👋 Deselect"
            elif event_type == 'baselineboard.node.add.instance':
                return f"➕ Baseline"
            else:
                return f"📝 {event_type.split('.')[-1]}"
        
        elif context == 'class':
            if event_type == 'class.created':
                placeholders = details.get('placeholder_count', 0)
                return f"🎭 Create({placeholders}p)"
            elif event_type == 'class.create.started':
                return f"🎭 Creating..."
            elif event_type == 'class_detail_opened':
                return f"👁️ Open"
            elif event_type == 'instance.create_from_class.started':
                return f"🎭➡️ Creating..."
            elif event_type == 'instance.created_from_class':
                instance_label = details.get('instance_label', 'Unknown')[:8]
                return f"🎭➡️ Made {instance_label}"
            elif event_type == 'class.updated':
                return f"💾 Update"
            else:
                return f"📝 {event_type.split('.')[-1]}"
        
        elif context == 'object_node':
            if event_type == 'object_node.edit.saved':
                obj_name = details.get('object_name', 'obj')[:6]
                new_value = details.get('new_value', '')[:8]
                return f"🔧 {obj_name}→{new_value}"
            elif event_type == 'object_node.edit.started':
                obj_name = details.get('object_name', 'obj')[:6]
                return f"🔧 Edit {obj_name}"
            elif event_type == 'object_node.edit.cancelled':
                return f"🔧 Cancel"
        
        return ""
    
    def group_similar_timestamps(self):
        """비슷한 타임스탬프를 그룹화"""
        # 타임스탬프를 시간순으로 정렬
        sorted_timestamps = sorted(list(self.timestamps))
        
        # 10초 간격으로 그룹화
        timestamp_groups = []
        current_group = []
        
        for ts in sorted_timestamps:
            if not current_group:
                current_group.append(ts)
            else:
                # 마지막 타임스탬프와 비교
                last_ts = current_group[-1]
                try:
                    last_time = datetime.strptime(last_ts, '%H:%M:%S')
                    curr_time = datetime.strptime(ts, '%H:%M:%S')
                    time_diff = (curr_time - last_time).total_seconds()
                    
                    # 10초 이내면 같은 그룹
                    if time_diff <= 10:
                        current_group.append(ts)
                    else:
                        timestamp_groups.append(current_group)
                        current_group = [ts]
                except:
                    current_group.append(ts)
        
        if current_group:
            timestamp_groups.append(current_group)
        
        return timestamp_groups
    
    def create_matrix(self):
        """매트릭스 생성"""
        timestamp_groups = self.group_similar_timestamps()
        
        # 엔티티를 클래스와 인스턴스로 분리하고 정렬
        entities = list(self.entity_events.keys())
        class_entities = sorted([e for e in entities if e.startswith('C:')])
        instance_entities = sorted([e for e in entities if e.startswith('I:')])
        sorted_entities = class_entities + instance_entities
        
        # 매트릭스 데이터 준비
        matrix_data = []
        
        for entity in sorted_entities:
            row_data = {'Entity': entity}
            entity_events = self.entity_events[entity]
            
            # 각 타임스탬프 그룹에 대해 이벤트 찾기
            for group_idx, ts_group in enumerate(timestamp_groups):
                group_events = []
                for event in entity_events:
                    if event['timestamp'] in ts_group:
                        group_events.append(event['content'])
                
                # 그룹 이름 생성 (대표 타임스탬프)
                group_name = f"{ts_group[0]}"
                if len(ts_group) > 1:
                    group_name += f"~{ts_group[-1]}"
                
                # 이벤트가 있으면 결합, 없으면 빈 문자열
                row_data[group_name] = " | ".join(group_events) if group_events else ""
            
            matrix_data.append(row_data)
        
        return matrix_data, timestamp_groups
    
    def save_matrix_html(self, matrix_data, timestamp_groups, output_file='timeline_matrix.html'):
        """HTML 매트릭스 저장"""
        
        html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Class-Instance Timeline Matrix</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; }
        th, td { border: 1px solid #ddd; padding: 3px; text-align: left; vertical-align: top; }
        th { background-color: #f2f2f2; position: sticky; top: 0; }
        .entity-col { background-color: #f0f0f0; font-weight: bold; min-width: 200px; position: sticky; left: 0; }
        .class-row { background-color: #fff3e0; }
        .instance-row { background-color: #e3f2fd; }
        .timestamp-col { min-width: 150px; max-width: 200px; }
        td { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .empty-cell { background-color: #fafafa; }
        .tooltip { position: relative; cursor: help; }
        .tooltip:hover::after { 
            content: attr(title); 
            position: absolute; 
            background: black; 
            color: white; 
            padding: 5px; 
            border-radius: 3px; 
            z-index: 1000; 
            bottom: 100%; 
            left: 50%; 
            transform: translateX(-50%); 
        }
    </style>
</head>
<body>
    <h1>Class-Instance Event Timeline Matrix</h1>
    <p>총 """ + str(len(matrix_data)) + """개 엔티티, """ + str(len(timestamp_groups)) + """개 시간 그룹</p>
    <p><strong>C:</strong> Class, <strong>I:</strong> Instance | 비슷한 시간대의 이벤트들을 그룹화했습니다.</p>
    
    <table>
        <thead>
            <tr>
                <th class="entity-col">Entity</th>
"""
        
        # 타임스탬프 그룹 헤더
        for ts_group in timestamp_groups:
            group_name = f"{ts_group[0]}"
            if len(ts_group) > 1:
                group_name += f"~{ts_group[-1]}"
            html += f'                <th class="timestamp-col">{group_name}</th>\n'
        
        html += """            </tr>
        </thead>
        <tbody>
"""
        
        # 데이터 행
        for row in matrix_data:
            entity = row['Entity']
            row_class = "class-row" if entity.startswith('C:') else "instance-row"
            
            # 엔티티 이름 간단히 표시
            entity_display = entity[:30] + '...' if len(entity) > 30 else entity
            
            html += f'            <tr class="{row_class}">\n'
            html += f'                <td class="entity-col tooltip" title="{entity}">{entity_display}</td>\n'
            
            # 각 타임스탬프 그룹에 대한 데이터
            for ts_group in timestamp_groups:
                group_name = f"{ts_group[0]}"
                if len(ts_group) > 1:
                    group_name += f"~{ts_group[-1]}"
                
                content = row.get(group_name, "")
                cell_class = "" if content else "empty-cell"
                
                html += f'                <td class="{cell_class} tooltip" title="{content}">{content}</td>\n'
            
            html += "            </tr>\n"
        
        html += """        </tbody>
    </table>
</body>
</html>"""
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"매트릭스 HTML이 {output_file}에 저장되었습니다.")
    
    def save_matrix_csv(self, matrix_data, output_file='timeline_matrix.csv'):
        """CSV 매트릭스 저장"""
        df = pd.DataFrame(matrix_data)
        df.to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"매트릭스 CSV가 {output_file}에 저장되었습니다.")
    
    def print_summary(self):
        """요약 출력"""
        class_count = len([e for e in self.entity_events.keys() if e.startswith('C:')])
        instance_count = len([e for e in self.entity_events.keys() if e.startswith('I:')])
        
        print(f"\n=== 매트릭스 요약 ===")
        print(f"총 이벤트 수: {len(self.events)}")
        print(f"클래스 수: {class_count}")
        print(f"인스턴스 수: {instance_count}")
        print(f"타임스탬프 수: {len(self.timestamps)}")
        
        # 가장 활발한 엔티티
        most_active = max(self.entity_events.items(), key=lambda x: len(x[1]))
        print(f"가장 활발한 엔티티: {most_active[0]} ({len(most_active[1])}개 이벤트)")
    
    def run(self):
        """전체 실행"""
        print("클래스-인스턴스 타임라인 매트릭스를 생성합니다...")
        
        self.load_events()
        self.extract_entity_events()
        
        if not self.entity_events:
            print("분석할 엔티티 이벤트가 없습니다.")
            return
        
        matrix_data, timestamp_groups = self.create_matrix()
        
        self.save_matrix_html(matrix_data, timestamp_groups)
        self.save_matrix_csv(matrix_data)
        
        self.print_summary()
        
        print(f"\n완료! timeline_matrix.html과 timeline_matrix.csv를 확인하세요.")

# 사용 예시
if __name__ == "__main__":
    matrix = TimelineMatrix('class_instance_events.json')
    matrix.run()