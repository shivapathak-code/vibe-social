const Comments = {
  activePostId: null,

  openModal: async (postId) => {
    Comments.activePostId = postId;
    window.activeCommentPostId = postId;

    const modal = document.getElementById('comments-modal');
    if (!modal) return;

    modal.classList.add('active');

    // Join post socket room for real-time commentary
    if (window.socket) {
      window.socket.emit('post:join', postId);
    }

    // Set loading preview state
    const listContainer = document.getElementById('comments-list-container');
    const postContext = document.getElementById('comment-post-context');
    listContainer.innerHTML = '<div style="display:flex; justify-content:center; padding:var(--space-8);"><div class="spinner spinner-sm"></div></div>';
    postContext.innerHTML = '';

    try {
      // Load Post Details for Header context
      const postData = await window.API.get(`/posts/${postId}`);
      if (postData.success) {
        const post = postData.post;
        const avatarStr = post.author.avatar 
          ? `<img src="${post.author.avatar}" alt="avatar">` 
          : post.author.fullName.charAt(0).toUpperCase();

        postContext.innerHTML = `
          <div style="display: flex; gap: var(--space-3); align-items: flex-start;">
            <div class="avatar avatar-sm">${avatarStr}</div>
            <div>
              <div style="font-weight:600; font-size:var(--text-sm);">${post.author.fullName} <span style="font-weight:400; color:var(--text-tertiary); font-size:11px;">@${post.author.username}</span></div>
              <p style="font-size:var(--text-sm); color:var(--text-secondary); margin-top:2px;">${window.Utils.renderPostText(post.content)}</p>
            </div>
          </div>
        `;
      }

      // Load Comments list
      const commentsData = await window.API.get(`/comments/post/${postId}`);
      if (commentsData.success) {
        Comments.renderCommentsList(commentsData.comments);
      }
    } catch (error) {
      listContainer.innerHTML = `<div style="text-align:center; color:var(--danger); padding:var(--space-4);">${error.message}</div>`;
    }
  },

  renderCommentsList: (comments) => {
    const container = document.getElementById('comments-list-container');
    if (!container) return;

    if (comments.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: var(--space-8) 0;">
          <div class="empty-state-icon" style="font-size:32px; margin-bottom:var(--space-2);">💬</div>
          <h4>No comments yet</h4>
          <p style="font-size:12px;">Be the first to share your thoughts!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    
    comments.forEach(comment => {
      const commentEl = document.createElement('div');
      commentEl.style.padding = 'var(--space-3) 0';
      commentEl.style.borderBottom = '1px solid var(--border-light)';
      
      const avatarStr = comment.author.avatar 
        ? `<img src="${comment.author.avatar}" alt="avatar">` 
        : comment.author.fullName.charAt(0).toUpperCase();

      // Check delete permission
      const isOwnComment = window.currentUser && comment.author && window.currentUser._id === comment.author._id;
      const deleteBtn = isOwnComment 
        ? `<button style="background:none; border:none; color:var(--danger); font-size:11px; cursor:pointer;" onclick="Comments.deleteComment('${comment._id}', this)">Delete</button>` 
        : '';

      // Build replies list HTML
      let repliesHTML = '';
      if (comment.replies && comment.replies.length > 0) {
        repliesHTML = `
          <div style="margin-left: var(--space-8); margin-top: var(--space-3); border-left: 2px solid var(--border-light); padding-left: var(--space-3); display: flex; flex-direction: column; gap: var(--space-2);">
            ${comment.replies.map(reply => {
              const replyAvatar = reply.author.avatar 
                ? `<img src="${reply.author.avatar}" alt="avatar">` 
                : reply.author.fullName.charAt(0).toUpperCase();
              
              const isOwnReply = window.currentUser && reply.author && window.currentUser._id === reply.author._id;
              const replyDeleteBtn = isOwnReply 
                ? `<button style="background:none; border:none; color:var(--danger); font-size:10px; cursor:pointer; margin-left:var(--space-2);" onclick="Comments.deleteComment('${reply._id}', this)">Delete</button>` 
                : '';

              return `
                <div style="display: flex; gap: var(--space-2); align-items: flex-start;">
                  <div class="avatar avatar-sm" style="width:24px; height:24px; font-size:10px;">${replyAvatar}</div>
                  <div style="flex:1;">
                    <div style="font-weight:600; font-size:11px;">${reply.author.fullName} <span style="font-weight:400; color:var(--text-tertiary); font-size:9px;">@${reply.author.username} • ${window.Utils.timeAgo(reply.createdAt)}</span></div>
                    <p style="font-size:12px; color:var(--text-primary);">${reply.content}</p>
                    ${replyDeleteBtn}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      commentEl.innerHTML = `
        <div style="display: flex; gap: var(--space-2); align-items: flex-start;">
          <div class="avatar avatar-sm">${avatarStr}</div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: var(--text-sm);">${comment.author.fullName} <span style="font-weight:400; color:var(--text-tertiary); font-size:10px;">@${comment.author.username}</span></span>
              <span style="font-size: 10px; color: var(--text-tertiary);">${window.Utils.timeAgo(comment.createdAt)}</span>
            </div>
            <p style="font-size: var(--text-sm); margin-top: 2px; color:var(--text-primary);">${comment.content}</p>
            <div style="display:flex; gap:var(--space-3); margin-top:4px; align-items:center;">
              <button style="background:none; border:none; color:var(--primary); font-size:11px; cursor:pointer;" onclick="Comments.replyTo('${comment._id}', '${comment.author.username}')">Reply</button>
              ${deleteBtn}
            </div>
            ${repliesHTML}
          </div>
        </div>
      `;
      
      container.appendChild(commentEl);
    });
  },

  submitComment: async (e) => {
    e.preventDefault();
    const input = document.getElementById('comment-text-input');
    const content = input.value.trim();
    if (!content || !Comments.activePostId) return;

    const postBtn = e.target.querySelector('button[type="submit"]');
    postBtn.disabled = true;

    try {
      const payload = {
        postId: Comments.activePostId,
        content
      };

      // Check if it's a nested reply
      if (Comments.replyCommentId) {
        payload.parentCommentId = Comments.replyCommentId;
      }

      const data = await window.API.post('/comments', payload);
      if (data.success) {
        input.value = '';
        Comments.replyCommentId = null;
        input.placeholder = "Add a comment...";
        
        // Reload comments lists
        const commentsData = await window.API.get(`/comments/post/${Comments.activePostId}`);
        if (commentsData.success) {
          Comments.renderCommentsList(commentsData.comments);
        }

        // Sync feed page posts comment counters locally
        const postCard = document.getElementById(`post-${Comments.activePostId}`);
        if (postCard) {
          const counter = postCard.querySelector('button:nth-child(2) .count');
          if (counter) {
            const current = parseInt(counter.textContent) || 0;
            counter.textContent = current + 1;
          }
        }
      }
    } catch (error) {
      window.Utils.showToast('Comment Failed', error.message, 'error');
    } finally {
      postBtn.disabled = false;
    }
  },

  replyTo: (commentId, username) => {
    const input = document.getElementById('comment-text-input');
    if (!input) return;
    Comments.replyCommentId = commentId;
    input.placeholder = `Replying to @${username}...`;
    input.focus();
  },

  deleteComment: async (commentId, btn) => {
    if (!confirm('Delete comment permanently?')) return;

    try {
      const data = await window.API.delete(`/comments/${commentId}`);
      if (data.success) {
        window.Utils.showToast('Comment Deleted', 'Your comment has been removed', 'success');
        
        // Reload list
        const commentsData = await window.API.get(`/comments/post/${Comments.activePostId}`);
        if (commentsData.success) {
          Comments.renderCommentsList(commentsData.comments);
        }

        // Sync post card comments count
        const postCard = document.getElementById(`post-${Comments.activePostId}`);
        if (postCard) {
          const counter = postCard.querySelector('button:nth-child(2) .count');
          if (counter) {
            const current = parseInt(counter.textContent) || 0;
            counter.textContent = Math.max(0, current - 1);
          }
        }
      }
    } catch (error) {
      window.Utils.showToast('Failed to delete comment', error.message, 'error');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('comment-input-bar');
  if (form) {
    form.addEventListener('submit', Comments.submitComment);
  }
});

window.Comments = Comments;
