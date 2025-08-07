#!/usr/bin/env python3
"""
클래스/인스턴스 이벤트를 시간순으로 정리하여 표 형태로 출력
각 instance ID와 class ID별로 열을 나누어서 표시
"""

import json
import pandas as pd
from datetime import datetime
from collections import defaultdict

class TimelineView:
    def __init__(self, events_file):
        self.events_file = events_file
        self.events = []
        self.entities = set()  # 모든 instance ID와 class ID
        
    def load_events(self):
        """JSON 이벤트 파일 로드"""
        with open(self.events_file, 'r', encoding='utf-8') as f:
            all_events = json.load(f)
        
        # hovered 이벤트 제외
        self.events = [event for event in all_events if 'hovered' not in event.get('event', '')]
        
        print(f"총 {len(all_events)}개의 이벤트 중 {len(self.events)}개를 로드했습니다. (hovered 이벤트 {len(all_events) - len(self.events)}개 제외)")
    
    def extract_entities(self):
        """모든 instance ID와 class ID 추출"""
        for event in self.events:
            details = event.get('details', {})
            
            # Instance IDs
            if 'instance_id' in details:
                self.entities.add(f"I:{details['instance_id']}")
            if 'instanceId' in details:
                self.entities.add(f"I:{details['instanceId']}")
            
            # Class IDs
            if 'class_id' in details:
                self.entities.add(f"C:{details['class_id']}")
                
        print(f"총 {len(self.entities)}개의 고유 엔티티를 찾았습니다.")
        
    def create_timeline_table(self):
        """타임라인 테이블 생성"""
        # 엔티티를 정렬 (Instance 먼저, 그 다음 Class)
        sorted_entities = sorted(list(self.entities))
        
        # 데이터 구조 준비
        timeline_data = []
        
        for i, event in enumerate(self.events):
            event_type = event.get('event', '')
            timestamp = event.get('timestamp', '')
            details = event.get('details', {})
            
            # 시간 파싱 (표시용)
            try:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                time_str = dt.strftime('%H:%M:%S')
            except:
                time_str = timestamp[-8:] if len(timestamp) >= 8 else timestamp
            
            # 행 데이터 초기화
            row_data = {
                'No': i + 1,
                'Time': time_str,
                'Event': event_type
            }
            
            # 각 엔티티별로 이벤트 내용 채우기
            for entity in sorted_entities:
                entity_type, entity_id = entity.split(':', 1)
                entity_short = entity_id[:8] + '...' if len(entity_id) > 8 else entity_id
                col_name = f"{entity_type}:{entity_short}"
                
                # 해당 엔티티와 관련된 이벤트인지 확인
                content = self.get_event_content_for_entity(event, entity_type, entity_id)
                row_data[col_name] = content
            
            timeline_data.append(row_data)
        
        return timeline_data, sorted_entities
    
    def get_event_content_for_entity(self, event, entity_type, entity_id):
        """특정 엔티티에 대한 이벤트 내용 반환"""
        event_type = event.get('event', '')
        details = event.get('details', {})
        
        # Instance 관련 이벤트
        if entity_type == 'I':
            if (details.get('instance_id') == entity_id or 
                details.get('instanceId') == entity_id):
                
                # if event_type == 'instance.edit.started':
                #     return f"✏️ Edit Started"
                if event_type == 'instance.updated':
                    text_changed = "T" if details.get('text_changed') else ""
                    graph_changed = "G" if details.get('graph_changed') else ""
                    changes = f"{text_changed}{graph_changed}" if text_changed or graph_changed else ""
                    return f"💾 Updated ({changes})"
                elif event_type == 'instance.created_from_class':
                    class_name = details.get('class_name', 'Unknown')[:8]
                    return f"🎭 Created from {class_name}"
                # elif event_type == 'instance_selected':
                #     return f"👆 Selected"
                # elif event_type == 'instance_deselected':
                #     return f"👋 Deselected"
                elif event_type == 'instance.deleted':
                    return f"🗑️ Deleted"
                # elif event_type == 'baselineboard.node.add.instance':
                #     return f"➕ Added to Baseline"
                else:
                    return f"📝 {event_type}"
        
        # Class 관련 이벤트
        elif entity_type == 'C':
            if details.get('class_id') == entity_id:
                
                if event_type == 'class.created':
                    placeholders = details.get('placeholder_count', 0)
                    return f"🎭 Created ({placeholders}p)"
                # elif event_type == 'class.create.started':
                #     return f"🎭 Creating..."
                # elif event_type == 'class_detail_opened':
                #     return f"👁️ Detail Opened"
                # elif event_type == 'instance.create_from_class.started':
                #     return f"🎭➡️ Creating Instance..."
                elif event_type == 'instance.created_from_class':
                    instance_label = details.get('instance_label', 'Unknown')[:8]
                    return f"🎭➡️ Created {instance_label}"
                elif event_type == 'class.updated':
                    return f"💾 Updated"
                # elif event_type == 'class.edit.started':
                #     return f"✏️ Edit Started"
                elif event_type == 'class.deleted':
                    return f"🗑️ Deleted"
                else:
                    return f"📝 {event_type}"
            
            # 인스턴스가 특정 클래스에서 생성되는 경우
            if (event_type in ['instance.create_from_class.started', 'instance.created_from_class'] and
                details.get('class_id') == entity_id):
                instance_label = details.get('instance_label', details.get('instanceLabel', 'Unknown'))[:8]
                # if event_type == 'instance.create_from_class.started':
                #     return f"🎭➡️ Creating {instance_label}..."
                # else:
                return f"🎭➡️ Created {instance_label}"
        
        # Object node 이벤트 (클래스 모드)
        if (event_type.startswith('object_node.') and 
            details.get('is_class_mode')):
            # 현재는 특정 클래스와 매핑하기 어려우므로 일반적으로 표시
            if event_type == 'object_node.edit.saved':
                obj_name = details.get('object_name', 'obj')[:6]
                new_value = details.get('new_value', '')[:6]
                return f"🔧 {obj_name}→{new_value}"
            # elif event_type == 'object_node.edit.started':
            #     obj_name = details.get('object_name', 'obj')[:6]
                # return f"🔧 Edit {obj_name}"
            elif event_type == 'object_node.hovered':
                return f"👀"
        
        return ""
    
    def save_timeline_html(self, timeline_data, entities, output_file='timeline_view.html'):
        """HTML 테이블로 저장"""
        
        # 엔티티 컬럼명 생성
        entity_columns = []
        for entity in entities:
            entity_type, entity_id = entity.split(':', 1)
            entity_short = entity_id[:8] + '...' if len(entity_id) > 8 else entity_id
            entity_columns.append(f"{entity_type}:{entity_short}")
        
        html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Class-Instance Timeline View</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 4px; text-align: left; }
        th { background-color: #f2f2f2; position: sticky; top: 0; }
        .instance-col { background-color: #e3f2fd; }
        .class-col { background-color: #fff3e0; }
        .time-col { background-color: #f5f5f5; width: 80px; }
        .event-col { background-color: #f9f9f9; min-width: 200px; }
        .no-col { width: 50px; text-align: center; }
        td { max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .empty-cell { background-color: #fafafa; }
    </style>
</head>
<body>
    <h1>Class-Instance Event Timeline</h1>
    <p>총 """ + str(len(timeline_data)) + """개 이벤트, """ + str(len(entities)) + """개 엔티티</p>
    <p><strong>I:</strong> Instance, <strong>C:</strong> Class</p>
    
    <table>
        <thead>
            <tr>
                <th class="no-col">No</th>
                <th class="time-col">Time</th>
                <th class="event-col">Event</th>
"""
        
        # 헤더 생성
        for entity in entities:
            entity_type, entity_id = entity.split(':', 1)
            entity_short = entity_id[:8] + '...' if len(entity_id) > 8 else entity_id
            col_class = "instance-col" if entity_type == "I" else "class-col"
            html += f'                <th class="{col_class}" title="{entity_id}">{entity_type}:{entity_short}</th>\n'
        
        html += """            </tr>
        </thead>
        <tbody>
"""
        
        # 데이터 행 생성
        for row in timeline_data:
            html += "            <tr>\n"
            html += f'                <td class="no-col">{row["No"]}</td>\n'
            html += f'                <td class="time-col">{row["Time"]}</td>\n'
            html += f'                <td class="event-col">{row["Event"]}</td>\n'
            
            for entity in entities:
                entity_type, entity_id = entity.split(':', 1)
                entity_short = entity_id[:8] + '...' if len(entity_id) > 8 else entity_id
                col_name = f"{entity_type}:{entity_short}"
                content = row.get(col_name, "")
                cell_class = "instance-col" if entity_type == "I" else "class-col"
                if not content:
                    cell_class += " empty-cell"
                html += f'                <td class="{cell_class}" title="{content}">{content}</td>\n'
            
            html += "            </tr>\n"
        
        html += """        </tbody>
    </table>
</body>
</html>"""
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html)
        
        print(f"타임라인 HTML이 {output_file}에 저장되었습니다.")
    
    def save_timeline_csv(self, timeline_data, entities, output_file='timeline_view.csv'):
        """CSV로 저장"""
        
        # 컬럼명 생성
        columns = ['No', 'Time', 'Event']
        for entity in entities:
            entity_type, entity_id = entity.split(':', 1)
            entity_short = entity_id[:8] + '...' if len(entity_id) > 8 else entity_id
            columns.append(f"{entity_type}:{entity_short}")
        
        # DataFrame 생성
        df = pd.DataFrame(timeline_data)
        df = df.reindex(columns=columns, fill_value="")
        
        # CSV 저장
        df.to_csv(output_file, index=False, encoding='utf-8-sig')
        print(f"타임라인 CSV가 {output_file}에 저장되었습니다.")
    
    def print_summary(self, entities):
        """요약 정보 출력"""
        instance_count = len([e for e in entities if e.startswith('I:')])
        class_count = len([e for e in entities if e.startswith('C:')])
        
        print(f"\n=== 타임라인 요약 ===")
        print(f"총 이벤트 수: {len(self.events)}")
        print(f"인스턴스 수: {instance_count}")
        print(f"클래스 수: {class_count}")
        print(f"전체 엔티티 수: {len(entities)}")
        
        # 주요 이벤트 타입 통계
        event_types = {}
        for event in self.events:
            event_type = event.get('event', '')
            event_types[event_type] = event_types.get(event_type, 0) + 1
        
        print(f"\n주요 이벤트 타입:")
        for event_type, count in sorted(event_types.items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {event_type}: {count}회")
    
    def run(self):
        """전체 실행"""
        print("클래스-인스턴스 타임라인 뷰를 생성합니다...")
        
        self.load_events()
        self.extract_entities()
        
        timeline_data, entities = self.create_timeline_table()
        
        self.save_timeline_html(timeline_data, entities)
        self.save_timeline_csv(timeline_data, entities)
        
        self.print_summary(entities)
        
        print(f"\n완료! timeline_view.html과 timeline_view.csv를 확인하세요.")

# 사용 예시
if __name__ == "__main__":
    viewer = TimelineView('class_instance_events.json')
    viewer.run()