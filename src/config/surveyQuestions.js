export const surveyQuestions = {
  ko: {
    section1: {
      title: "작업 부하 및 성과",
      questions: [
        {
          id: "mental_demand",
          question: "작업이 정신적으로 얼마나 부담되었습니까?",
          questionTranslation: "How mentally demanding was the task?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 부담되지 않음",
            maxLabel: "매우 부담됨"
          }
        },
        {
          id: "temporal_demand",
          question: "작업 속도가 얼마나 급박하거나 서둘러야 했습니까?",
          questionTranslation: "How hurried or rushed was the pace of the task?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 급하지 않음",
            maxLabel: "매우 급박함"
          }
        },
        {
          id: "performance",
          question: "주어진 작업을 얼마나 성공적으로 수행하였습니까?",
          questionTranslation: "How successful were you in accomplishing what you were asked to do?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 성공하지 못함",
            maxLabel: "매우 성공적임"
          }
        },
        {
          id: "effort",
          question: "현재 성과를 달성하기 위해 얼마나 노력해야 했습니까?",
          questionTranslation: "How hard did you have to work to accomplish your level of performance?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 노력하지 않음",
            maxLabel: "매우 많은 노력 필요"
          }
        },
        {
          id: "frustration",
          question: "작업 중 얼마나 불안, 짜증, 스트레스를 느꼈습니까?",
          questionTranslation: "How insecure, discouraged, irritated, stressed, and annoyed were you?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 느끼지 않음",
            maxLabel: "매우 심하게 느낌"
          }
        }
      ]
    },
    section2: {
      title: "사용자 경험 및 몰입도",
      questions: [
        {
          id: "exploration",
          question: "지루한 반복 없이 다양한 아이디어나 디자인을 자유롭게 탐색할 수 있었습니까?",
          questionTranslation: "It was easy for me to explore many different options, ideas, designs, or outcomes without a lot of tedious, repetitive instruction.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "engagement",
          question: "이 활동에 몰입하고 즐거움을 느꼈습니까? 다시 하고 싶다고 느꼈습니까?",
          questionTranslation: "I was very absorbed/engaged in this activity – I enjoyed it and would do it again.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "effort_reward",
          question: "이 활동에서 얻은 결과는 들인 노력만큼 가치 있었습니까?",
          questionTranslation: "What I was able to produce was worth the effort required to produce it.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "transparency",
          question: "활동 중에 도구/인터페이스의 존재를 잊고 작업에만 집중할 수 있었습니까?",
          questionTranslation: "While I was doing the activity, the tool/interface/system 'disappeared' and I was able to concentrate on the activity.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "expressiveness",
          question: "이 활동을 통해 표현력 있게 창의성을 발휘할 수 있었습니까?",
          questionTranslation: "I was able to be very expressive and creative while doing the activity.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        }
      ]
    },
    section3: {
      title: "시스템별 기능 평가",
      questions: [
        {
          id: "precise1",
          question: "의도를 명확히 반영하는 프롬프트를 작성할 수 있었다.",
          questionTranslation: "I was able to write prompts that precisely conveyed my intent.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "precise2",
          question: "수정하고자 하는 부분을 정확하게 지정해 수정할 수 있었다.",
          questionTranslation: "I could precisely target and revise the specific parts I wanted to change.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "efficient1",
          question: "프롬프트를 효율적으로 재사용할 수 있었다.",
          questionTranslation: "I was able to reuse the prompt efficiently.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "efficient2",
          question: "여러 프롬프트에서 공통된 속성을 효과적으로 일괄 수정할 수 있었다.",
          questionTranslation: "I could efficiently update shared attributes across multiple prompts.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
      ]
    }, 
    section4: {
      title: "시스템별 기능 평가",
      questions: [
        {
          id: "dg1_clarity",
          question: "이번 작업에서 필요한 모든 요소와 그 요소들 간의 관계를 명확하게 표현할 수 있었다.",
          questionTranslation: "I was able to clearly represent all necessary elements and their relationships for this task.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "dg2_prompt_to_image",
          question: "내가 입력한 요소가 결과물의 어떤 부분과 연결되는지 명확하게 이해할 수 있었다.",
          questionTranslation: "I could clearly understand which elements of my input corresponded to specific parts of the output.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "dg2_image_to_prompt",
          question: "결과물의 특정 부분을 변경하고 싶을 때 어떤 입력 요소를 수정해야 하는지 쉽게 파악할 수 있었다.",
          questionTranslation: "I could easily identify which input elements to modify when I wanted to change specific parts of the output.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "dg3_reusability",
          question: "내 작업을 다른 유사한 작업에 재사용하거나 변형하기 쉬웠다.",
          questionTranslation: "I found it easy to reuse or adapt my work for other similar tasks.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        },
        {
          id: "dg3_selective_edit",
          question: "다른 부분은 그대로 두고 원하는 부분만 선택적으로 수정할 수 있었다.",
          questionTranslation: "I was able to selectively modify only the parts I wanted while keeping everything else unchanged.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "전혀 그렇지 않음",
            maxLabel: "매우 그렇다"
          }
        }
      ]
    }
  },

  en: {
    section1: {
      title: "Task Load & Performance",
      questions: [
        {
          id: "mental_demand",
          question: "How mentally demanding was the task?",
          questionTranslation: "작업이 정신적으로 얼마나 부담되었습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Very Low",
            maxLabel: "Very High"
          }
        },
        {
          id: "temporal_demand",
          question: "How hurried or rushed was the pace of the task?",
          questionTranslation: "작업 속도가 얼마나 급박하거나 서둘러야 했습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Not Hurried",
            maxLabel: "Very Hurried"
          }
        },
        {
          id: "performance",
          question: "How successful were you in accomplishing what you were asked to do?",
          questionTranslation: "주어진 작업을 얼마나 성공적으로 수행하였습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Very Unsuccessful",
            maxLabel: "Very Successful"
          }
        },
        {
          id: "effort",
          question: "How hard did you have to work to accomplish your level of performance?",
          questionTranslation: "현재 성과를 달성하기 위해 얼마나 노력해야 했습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Very Little Effort",
            maxLabel: "Very High Effort"
          }
        },
        {
          id: "frustration",
          question: "How insecure, discouraged, irritated, stressed, and annoyed were you?",
          questionTranslation: "작업 중 얼마나 불안, 짜증, 스트레스를 느꼈습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Not at All",
            maxLabel: "Very Much"
          }
        }
      ]
    },
    section2: {
      title: "User Experience & Engagement",
      questions: [
        {
          id: "exploration",
          question: "It was easy for me to explore many different options, ideas, designs, or outcomes without a lot of tedious, repetitive instruction.",
          questionTranslation: "지루한 반복 없이 다양한 아이디어나 디자인을 자유롭게 탐색할 수 있었습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "collaboration",
          question: "I was able to work together with others easily while doing this activity.",
          questionTranslation: "이 활동을 하면서 다른 사람들과 쉽게 협력할 수 있었습니다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "engagement",
          question: "I was very absorbed/engaged in this activity – I enjoyed it and would do it again.",
          questionTranslation: "이 활동에 몰입하고 즐거움을 느꼈습니까? 다시 하고 싶다고 느꼈습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "effort_reward",
          question: "What I was able to produce was worth the effort required to produce it.",
          questionTranslation: "이 활동에서 얻은 결과는 들인 노력만큼 가치 있었습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "transparency",
          question: "While I was doing the activity, the tool/interface/system 'disappeared' and I was able to concentrate on the activity.",
          questionTranslation: "활동 중에 도구/인터페이스의 존재를 잊고 작업에만 집중할 수 있었습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "expressiveness",
          question: "I was able to be very expressive and creative while doing the activity.",
          questionTranslation: "이 활동을 통해 표현력 있게 창의성을 발휘할 수 있었습니까?",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        }
      ]
    },
    section3: {
      title: "System-Specific Features",
      questions: [
        {
          id: "precise1",
          question: "I was able to write prompts that precisely conveyed my intent.",
          questionTranslation: "의도를 명확히 반영하는 프롬프트를 작성할 수 있었다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "precise2",
          question: "I could precisely target and revise the specific parts I wanted to change.",
          questionTranslation: "수정하고자 하는 부분을 정확하게 지정해 수정할 수 있었다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "efficient1",
          question: "I was able to reuse the prompt efficiently.",
          questionTranslation: "프롬프트를 효율적으로 재사용할 수 있었다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "efficient2",
          question: "I could efficiently update shared attributes across multiple prompts.",
          questionTranslation: "여러 프롬프트에서 공통된 속성을 효과적으로 일괄 수정할 수 있었다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
      ]
    }, 
    section4: {
      title: "System-Specific Features",
      questions: [
        {
          id: "dg1_clarity",
          question: "I was able to clearly represent all necessary elements and their relationships for this task.",
          questionTranslation: "이번 작업에서 필요한 모든 요소와 그 요소들 간의 관계를 명확하게 표현할 수 있었다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "dg2_prompt_to_image",
          question: "I could clearly understand which elements of my input corresponded to specific parts of the output.",
          questionTranslation: "내가 입력한 요소가 결과물의 어떤 부분과 연결되는지 명확하게 이해할 수 있었다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "dg2_image_to_prompt",
          question: "I could easily identify which input elements to modify when I wanted to change specific parts of the output.",
          questionTranslation: "결과물의 특정 부분을 변경하고 싶을 때 어떤 입력 요소를 수정해야 하는지 쉽게 파악할 수 있었다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "dg3_reusability",
          question: "I found it easy to reuse or adapt my work for other similar tasks.",
          questionTranslation: "내 작업을 다른 유사한 작업에 재사용하거나 변형하기 쉬웠다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        },
        {
          id: "dg3_selective_edit",
          question: "I was able to selectively modify only the parts I wanted while keeping everything else unchanged.",
          questionTranslation: "다른 부분은 그대로 두고 원하는 부분만 선택적으로 수정할 수 있었다.",
          scale: {
            min: 1,
            max: 7,
            minLabel: "Strongly Disagree",
            maxLabel: "Strongly Agree"
          }
        }
      ]
    }
  }
};

// Section titles with bilingual support
export const sectionTitles = {
  ko: {
    section1: "작업 부하 및 성과",
    section2: "사용자 경험 및 몰입도",
    section3: "시스템별 기능 평가",
    section4: "시스템별 기능 평가"
  },
  en: {
    section1: "Task Load & Performance",
    section2: "User Experience & Engagement",
    section3: "System-Specific Features",
    section4: "System-Specific Features"
  }
};

export const systemLabels = {
  ko: {
    system1: "시스템 1 (Baseline)",
    system2: "시스템 2 (Advanced)"
  },
  en: {
    system1: "System 1 (Baseline)",
    system2: "System 2 (Advanced)"
  }
};