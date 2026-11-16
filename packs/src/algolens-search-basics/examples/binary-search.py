# AlgoLens teaching example — binary search (pack algolens-search-basics).
# `input` is the JSON from the Input panel, e.g. {"nums": [...], "target": 9}.
nums = list(input['nums'])
first_target = input['target']

# Two passes: one hitting the preset target, one missing on purpose, so every
# teaching step of the course records at least one real frame.
for target in (first_target, first_target + 1):
    left, right = 0, len(nums) - 1
    trace({'type': 'array', 'values': nums[:], 'focus': [left, right]},
          f'初始化区间 [{left}, {right}]，目标 {target} / init range, target {target}',
          line=9, variables={'left': left, 'right': right, 'target': target},
          lesson_step='init')

    found_at = -1
    while left <= right:
        mid = (left + right) // 2
        trace({'type': 'array', 'values': nums[:], 'focus': [mid]},
              f'检查 nums[{mid}] = {nums[mid]}，目标 {target} / probe the middle',
              line=17, variables={'left': left, 'right': right, 'mid': mid, 'target': target},
              lesson_step='compare')
        if nums[mid] == target:
            found_at = mid
            trace({'type': 'array', 'values': nums[:], 'focus': [mid], 'done': True},
                  f'找到目标 {target}，下标 {mid} / hit at index {mid}',
                  line=22, variables={'left': left, 'right': right, 'mid': mid, 'target': target},
                  lesson_step='found')
            break
        if nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
        trace({'type': 'array', 'values': nums[:], 'focus': [left, right]},
              f'区间收缩为 [{left}, {right}] / narrowed to [{left}, {right}]',
              line=29, variables={'left': left, 'right': right, 'mid': mid, 'target': target},
              lesson_step='narrow')

    if found_at < 0:
        trace({'type': 'array', 'values': nums[:]},
              f'区间为空，{target} 不在数组中 / empty range, {target} is absent',
              line=38, variables={'left': left, 'right': right, 'target': target},
              lesson_step='missing')
